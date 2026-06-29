import type { TrackSource } from "@prisma/client"
import { db } from "@/lib/db"
import { deleteObject } from "@/lib/s3"
import { albumSlug, normalizeKey } from "@/lib/slug"

/**
 * Delete a cover object from storage only if nothing else still points at it.
 * Covers used to be shared (one key on track + album + artist), so a blind
 * delete on one entity could wipe another's image — this prevents that.
 */
export async function deleteCoverIfUnreferenced(
  key: string | null | undefined,
) {
  if (!key) return
  const [tracks, albums, artists, playlists] = await Promise.all([
    db.track.count({ where: { coverKey: key } }),
    db.album.count({ where: { coverKey: key } }),
    db.artist.count({ where: { coverKey: key } }),
    db.playlist.count({ where: { coverKey: key } }),
  ])
  if (tracks + albums + artists + playlists === 0) {
    await deleteObject(key).catch(() => {})
  }
}

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

  // Only the track owns the imported cover; album/artist display it via the
  // cover-route fallback until the user uploads their own. This keeps every
  // entity's cover independent (no shared storage key to accidentally delete).
  if (input.artistName) {
    const artist = await upsertArtist(input.artistName)
    artistId = artist.id

    if (input.albumTitle) {
      const album = await upsertAlbum({
        title: input.albumTitle,
        artistId: artist.id,
        artistName: input.artistName,
        year: input.year,
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
