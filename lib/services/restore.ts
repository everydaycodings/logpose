import type { Prisma } from "@prisma/client"
import AdmZip from "adm-zip"
import { db } from "@/lib/db"
import { putObject } from "@/lib/s3"

const CONTENT_TYPE: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  webm: "audio/webm",
  opus: "audio/opus",
  ogg: "audio/ogg",
  flac: "audio/flac",
  wav: "audio/wav",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
}

type Dump = {
  data: {
    artists: Prisma.ArtistUncheckedCreateInput[]
    albums: Prisma.AlbumUncheckedCreateInput[]
    tracks: Prisma.TrackUncheckedCreateInput[]
    playlists: Prisma.PlaylistUncheckedCreateInput[]
    playlistTracks: Prisma.PlaylistTrackUncheckedCreateInput[]
  }
}

/**
 * Restore a LogPose backup .zip: re-upload assets and upsert all rows.
 * Idempotent — existing rows (matched by id) are updated, missing ones created.
 */
export async function restoreBackup(zipBuffer: Buffer) {
  const zip = new AdmZip(zipBuffer)

  const libEntry = zip.getEntry("library.json")
  if (!libEntry) throw new Error("library.json not found in archive")
  const dump = JSON.parse(libEntry.getData().toString("utf8")) as Dump

  // 1. Re-upload assets.
  let assets = 0
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    if (!entry.entryName.startsWith("assets/")) continue
    const key = entry.entryName.slice("assets/".length)
    const ext = key.split(".").pop()?.toLowerCase() ?? ""
    await putObject(key, entry.getData(), CONTENT_TYPE[ext] ?? "application/octet-stream")
    assets++
  }

  // 2. Upsert rows in FK-safe order.
  const { artists, albums, tracks, playlists, playlistTracks } = dump.data
  for (const a of artists) {
    await db.artist.upsert({ where: { id: a.id! }, update: a, create: a })
  }
  for (const a of albums) {
    await db.album.upsert({ where: { id: a.id! }, update: a, create: a })
  }
  for (const t of tracks) {
    await db.track.upsert({ where: { id: t.id! }, update: t, create: t })
  }
  for (const p of playlists) {
    await db.playlist.upsert({ where: { id: p.id! }, update: p, create: p })
  }
  for (const pt of playlistTracks) {
    await db.playlistTrack.upsert({ where: { id: pt.id! }, update: pt, create: pt })
  }

  return {
    assets,
    artists: artists.length,
    albums: albums.length,
    tracks: tracks.length,
    playlists: playlists.length,
  }
}
