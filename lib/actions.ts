"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { deleteObject, putObject } from "@/lib/s3"
import { upsertAlbum, upsertArtist } from "@/lib/services/library"
import { fetchCoverArt, lookupRecording } from "@/lib/services/metadata"
import { albumSlug, normalizeKey } from "@/lib/slug"

export async function toggleLike(trackId: string) {
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { liked: true },
  })
  if (!track) return
  await db.track.update({
    where: { id: trackId },
    data: { liked: !track.liked },
  })
  revalidatePath("/liked")
  revalidatePath("/")
}

export async function createPlaylist(name: string) {
  const clean = z.string().min(1).max(120).safeParse(name.trim())
  if (!clean.success) return null
  const playlist = await db.playlist.create({ data: { name: clean.data } })
  revalidatePath("/")
  return playlist.id
}

export async function renamePlaylist(id: string, name: string) {
  const clean = z.string().min(1).max(120).safeParse(name.trim())
  if (!clean.success) return
  await db.playlist.update({ where: { id }, data: { name: clean.data } })
  revalidatePath(`/playlist/${id}`)
  revalidatePath("/")
}

export async function deletePlaylist(id: string) {
  await db.playlist.delete({ where: { id } })
  revalidatePath("/")
}

export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  const last = await db.playlistTrack.findFirst({
    where: { playlistId },
    orderBy: { position: "desc" },
    select: { position: true },
  })
  const position = (last?.position ?? -1) + 1
  await db.playlistTrack
    .create({ data: { playlistId, trackId, position } })
    .catch(() => null) // ignore duplicates (unique constraint)
  revalidatePath(`/playlist/${playlistId}`)
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
) {
  await db.playlistTrack.deleteMany({ where: { playlistId, trackId } })
  revalidatePath(`/playlist/${playlistId}`)
}

export async function reorderPlaylist(playlistId: string, trackIds: string[]) {
  await db.$transaction(
    trackIds.map((trackId, position) =>
      db.playlistTrack.updateMany({
        where: { playlistId, trackId },
        data: { position },
      }),
    ),
  )
  revalidatePath(`/playlist/${playlistId}`)
}

const updateTrackSchema = z.object({
  title: z.string().min(1).max(300),
  artist: z.string().max(300).optional(),
  album: z.string().max(300).optional(),
  year: z.coerce.number().int().min(0).max(3000).optional(),
  genre: z.string().max(120).optional(),
  trackNumber: z.coerce.number().int().min(0).max(100000).optional(),
  discNumber: z.coerce.number().int().min(0).max(1000).optional(),
  lyrics: z.string().max(20000).optional(),
})

export async function updateTrack(
  trackId: string,
  input: z.input<typeof updateTrackSchema>,
) {
  const parsed = updateTrackSchema.safeParse(input)
  if (!parsed.success) return { error: "Please check the fields." }
  const data = parsed.data

  // Re-wire artist/album by name (create if needed).
  let artistId: string | null = null
  let albumId: string | null = null
  if (data.artist) {
    const artist = await db.artist.upsert({
      where: { slug: normalizeKey(data.artist) },
      update: {},
      create: { name: data.artist, slug: normalizeKey(data.artist) },
    })
    artistId = artist.id
    if (data.album) {
      const album = await db.album.upsert({
        where: { slug: albumSlug(data.artist, data.album) },
        update: data.year ? { year: data.year } : {},
        create: {
          title: data.album,
          slug: albumSlug(data.artist, data.album),
          artistId: artist.id,
          year: data.year,
        },
      })
      albumId = album.id
    }
  }

  await db.track.update({
    where: { id: trackId },
    data: {
      title: data.title,
      year: data.year,
      genre: data.genre,
      trackNumber: data.trackNumber ?? null,
      discNumber: data.discNumber ?? null,
      lyrics: data.lyrics,
      artistId,
      albumId,
    },
  })
  revalidatePath(`/track/${trackId}/edit`)
  revalidatePath("/")
  return { ok: true }
}

const renameSchema = z.string().min(1).max(300)

/** Rename an artist (blocks if another artist already owns that name). */
export async function updateArtist(artistId: string, name: string) {
  const parsed = renameSchema.safeParse(name.trim())
  if (!parsed.success) return { error: "Please enter a name." }
  const slug = normalizeKey(parsed.data)

  const clash = await db.artist.findUnique({ where: { slug } })
  if (clash && clash.id !== artistId) {
    return { error: `An artist named "${parsed.data}" already exists.` }
  }

  await db.artist.update({
    where: { id: artistId },
    data: { name: parsed.data, slug },
  })
  revalidatePath(`/artist/${artistId}`)
  revalidatePath("/")
  return { ok: true }
}

const updateAlbumSchema = z.object({
  title: z.string().min(1).max(300),
  year: z.coerce.number().int().min(0).max(3000).optional(),
})

/** Edit an album's title/year (blocks if the new title clashes with another). */
export async function updateAlbum(
  albumId: string,
  input: z.input<typeof updateAlbumSchema>,
) {
  const parsed = updateAlbumSchema.safeParse(input)
  if (!parsed.success) return { error: "Please check the fields." }
  const { title, year } = parsed.data

  const album = await db.album.findUnique({
    where: { id: albumId },
    include: { artist: { select: { name: true } } },
  })
  if (!album) return { error: "Album not found." }

  const slug = albumSlug(album.artist.name, title)
  const clash = await db.album.findUnique({ where: { slug } })
  if (clash && clash.id !== albumId) {
    return { error: `An album named "${title}" already exists for this artist.` }
  }

  await db.album.update({
    where: { id: albumId },
    data: { title, slug, year: year ?? null },
  })
  revalidatePath(`/album/${albumId}`)
  revalidatePath("/")
  return { ok: true }
}

/** Re-run MusicBrainz/Cover Art lookup and update the track. */
export async function reenrichTrack(trackId: string) {
  const track = await db.track.findUnique({
    where: { id: trackId },
    include: { artist: { select: { name: true } } },
  })
  if (!track) return { error: "Track not found." }

  const enriched = await lookupRecording(
    track.title,
    track.artist?.name ?? undefined,
  )
  if (!enriched) return { error: "No match found on MusicBrainz." }

  const artistName = enriched.artist ?? track.artist?.name
  let artistId = track.artistId
  let albumId = track.albumId
  if (artistName) {
    const artist = await upsertArtist(artistName)
    artistId = artist.id
    if (enriched.album) {
      const album = await upsertAlbum({
        title: enriched.album,
        artistId: artist.id,
        artistName,
        year: enriched.year,
        mbid: enriched.mbid,
      })
      albumId = album.id
    }
  }

  let coverKey = track.coverKey
  if (!coverKey && enriched.releaseMbid) {
    const cover = await fetchCoverArt(enriched.releaseMbid)
    if (cover) {
      coverKey = `covers/${randomUUID()}.jpg`
      await putObject(coverKey, cover, "image/jpeg")
    }
  }

  await db.track.update({
    where: { id: trackId },
    data: {
      year: enriched.year ?? track.year,
      mbid: enriched.mbid ?? track.mbid,
      artistId,
      albumId,
      coverKey,
    },
  })
  revalidatePath(`/track/${trackId}/edit`)
  revalidatePath("/")
  return { ok: true }
}

export async function deleteOrphans() {
  const { findOrphans } = await import("@/lib/services/maintenance")
  const { keys } = await findOrphans()
  for (const key of keys) await deleteObject(key).catch(() => {})
  revalidatePath("/settings")
  return { deleted: keys.length }
}

export async function deleteTrack(trackId: string) {
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { mp3Key: true, originalKey: true, coverKey: true },
  })
  if (!track) return
  await db.track.delete({ where: { id: trackId } })
  for (const key of [track.mp3Key, track.originalKey, track.coverKey]) {
    if (key) await deleteObject(key).catch(() => {})
  }
  revalidatePath("/")
}
