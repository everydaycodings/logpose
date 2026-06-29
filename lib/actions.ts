"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { deleteObject } from "@/lib/s3"
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
      lyrics: data.lyrics,
      artistId,
      albumId,
    },
  })
  revalidatePath(`/track/${trackId}/edit`)
  revalidatePath("/")
  return { ok: true }
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
