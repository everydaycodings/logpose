import { type DBSchema, type IDBPDatabase, openDB } from "idb"
import type { PlayableTrack } from "@/lib/types"

// IndexedDB is the single source of truth for offline data: the audio blob, its
// cover + lyrics, the PlayableTrack metadata, and the timestamps that drive the
// 30-day expiry. The service worker (public/sw.js) reads the `tracks` store
// directly to serve /api/stream, /api/cover and /api/tracks/[id]/lyrics offline,
// so the DB name / version / store names here MUST stay in sync with that file.
export const DB_NAME = "logpose-offline"
export const DB_VERSION = 1

export const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export type OfflineTrack = {
  id: string
  track: PlayableTrack
  audio: Blob
  cover: Blob | null
  lyrics: string | null
  syncedLyrics: string | null
  downloadedAt: number
  expiresAt: number
  bytes: number
}

export type OutboxPlay = {
  trackId: string
  playedAt: number
}

interface OfflineDB extends DBSchema {
  tracks: { key: string; value: OfflineTrack }
  outbox: { key: number; value: OutboxPlay }
  pending: { key: string; value: { id: string; track: PlayableTrack } }
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("tracks", { keyPath: "id" })
        db.createObjectStore("outbox", { autoIncrement: true })
        db.createObjectStore("pending", { keyPath: "id" })
      },
    })
  }
  return dbPromise
}

// --- tracks ---

export async function putTrack(
  data: Omit<OfflineTrack, "downloadedAt" | "expiresAt" | "bytes">,
) {
  const now = Date.now()
  const bytes = data.audio.size + (data.cover?.size ?? 0)
  const record: OfflineTrack = {
    ...data,
    downloadedAt: now,
    expiresAt: now + EXPIRY_MS,
    bytes,
  }
  const db = await getDB()
  await db.put("tracks", record)
  return record
}

export async function getTrack(id: string) {
  return (await getDB()).get("tracks", id)
}

export async function hasTrack(id: string) {
  const key = await (await getDB()).getKey("tracks", id)
  return key != null
}

export async function deleteTrack(id: string) {
  await (await getDB()).delete("tracks", id)
}

export async function allTracks() {
  return (await getDB()).getAll("tracks")
}

export async function allTrackIds() {
  return (await getDB()).getAllKeys("tracks")
}

export async function totalBytes() {
  const rows = await allTracks()
  return rows.reduce((sum, r) => sum + r.bytes, 0)
}

// Refresh the 30-day clock for every download — called on each online app load
// so actively-used offline libraries never expire.
export async function refreshExpiry() {
  const db = await getDB()
  const tx = db.transaction("tracks", "readwrite")
  const expiresAt = Date.now() + EXPIRY_MS
  for await (const cursor of tx.store) {
    cursor.update({ ...cursor.value, expiresAt })
  }
  await tx.done
}

// Drop downloads whose 30-day window elapsed (only happens if the app went
// unopened/offline that whole time).
export async function pruneExpired() {
  const db = await getDB()
  const tx = db.transaction("tracks", "readwrite")
  const now = Date.now()
  for await (const cursor of tx.store) {
    if (cursor.value.expiresAt <= now) await cursor.delete()
  }
  await tx.done
}

// --- pending (resumable bulk downloads) ---

export async function addPending(track: PlayableTrack) {
  await (await getDB()).put("pending", { id: track.id, track })
}

export async function removePending(id: string) {
  await (await getDB()).delete("pending", id)
}

export async function allPending() {
  const rows = await (await getDB()).getAll("pending")
  return rows.map((r) => r.track)
}

// --- outbox (offline play events) ---

export async function enqueuePlay(trackId: string) {
  await (await getDB()).add("outbox", { trackId, playedAt: Date.now() })
}

export async function drainOutbox() {
  const db = await getDB()
  const all = await db.getAll("outbox")
  await db.clear("outbox")
  return all
}
