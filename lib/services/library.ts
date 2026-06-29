import type { TrackSource } from "@prisma/client"
import { db } from "@/lib/db"
import { albumSlug, normalizeKey } from "@/lib/slug"

export async function upsertArtist(name: string, coverKey?: string) {
  const slug = normalizeKey(name)
  return db.artist.upsert({
    where: { slug },
    update: coverKey ? { coverKey } : {},
    create: { name, slug, coverKey },
  })
}

export async function upsertAlbum(args: {
  title: string
  artistId: string
  artistName: string
  year?: number
  coverKey?: string
  mbid?: string
}) {
  const slug = albumSlug(args.artistName, args.title)
  return db.album.upsert({
    where: { slug },
    update: {
      ...(args.coverKey ? { coverKey: args.coverKey } : {}),
      ...(args.year ? { year: args.year } : {}),
      ...(args.mbid ? { mbid: args.mbid } : {}),
    },
    create: {
      title: args.title,
      slug,
      artistId: args.artistId,
      year: args.year,
      coverKey: args.coverKey,
      mbid: args.mbid,
    },
  })
}

export type FinalizeTrackInput = {
  title: string
  artistName?: string
  albumTitle?: string
  year?: number
  genre?: string
  trackNumber?: number
  durationMs?: number
  gainDb?: number
  source: TrackSource
  sourceUrl?: string
  mbid?: string
  originalKey?: string
  mp3Key: string
  coverKey?: string
}

/**
 * Create a Track, wiring up (and creating if needed) its Artist and Album.
 * Album art falls back to the track's own cover so album pages always show one.
 */
export async function finalizeTrack(input: FinalizeTrackInput) {
  let artistId: string | undefined
  let albumId: string | undefined

  if (input.artistName) {
    const artist = await upsertArtist(input.artistName, input.coverKey)
    artistId = artist.id

    if (input.albumTitle) {
      const album = await upsertAlbum({
        title: input.albumTitle,
        artistId: artist.id,
        artistName: input.artistName,
        year: input.year,
        coverKey: input.coverKey,
        mbid: input.mbid,
      })
      albumId = album.id
    }
  }

  return db.track.create({
    data: {
      title: input.title,
      trackNumber: input.trackNumber,
      durationMs: input.durationMs,
      gainDb: input.gainDb,
      year: input.year,
      genre: input.genre,
      source: input.source,
      sourceUrl: input.sourceUrl,
      mbid: input.mbid,
      originalKey: input.originalKey,
      mp3Key: input.mp3Key,
      coverKey: input.coverKey,
      artistId,
      albumId,
    },
  })
}
