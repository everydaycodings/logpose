import { create } from "zustand"
import {
  allPending,
  allTrackIds,
  deleteTrack as dbDeleteTrack,
  totalBytes,
} from "@/lib/offline/db"
import { downloadMany, downloadTrack } from "@/lib/offline/download"
import type { PlayableTrack } from "@/lib/types"

export type DownloadStatus = "downloading" | "done"

type DownloadsState = {
  status: Record<string, DownloadStatus>
  // 0..1 while downloading.
  progress: Record<string, number>
  bytesUsed: number
  hydrated: boolean

  hydrate: () => Promise<void>
  download: (track: PlayableTrack) => Promise<void>
  downloadTracks: (tracks: PlayableTrack[]) => Promise<void>
  downloadAll: () => Promise<void>
  remove: (id: string) => Promise<void>
  refreshBytes: () => Promise<void>
}

function setStatus(
  set: (fn: (s: DownloadsState) => Partial<DownloadsState>) => void,
  id: string,
  status: DownloadStatus | null,
  progress?: number,
) {
  set((s) => {
    const nextStatus = { ...s.status }
    const nextProgress = { ...s.progress }
    if (status == null) {
      delete nextStatus[id]
      delete nextProgress[id]
    } else {
      nextStatus[id] = status
      if (progress != null) nextProgress[id] = progress
    }
    return { status: nextStatus, progress: nextProgress }
  })
}

export const useDownloads = create<DownloadsState>((set, get) => ({
  status: {},
  progress: {},
  bytesUsed: 0,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return
    const [ids, pending, bytes] = await Promise.all([
      allTrackIds(),
      allPending(),
      totalBytes(),
    ])
    const status: Record<string, DownloadStatus> = {}
    for (const id of ids) status[id] = "done"
    set({ status, bytesUsed: bytes, hydrated: true })
    // Resume any bulk job interrupted mid-flight.
    if (pending.length > 0) void get().downloadTracks(pending)
  },

  download: async (track) => {
    if (get().status[track.id]) return
    setStatus(set, track.id, "downloading", 0)
    try {
      await downloadTrack(track, (f) => setStatus(set, track.id, "downloading", f))
      setStatus(set, track.id, "done", 1)
      await get().refreshBytes()
    } catch {
      setStatus(set, track.id, null)
    }
  },

  downloadTracks: async (tracks) => {
    const todo = tracks.filter((t) => get().status[t.id] !== "done")
    for (const t of todo) setStatus(set, t.id, "downloading", 0)
    await downloadMany(todo, (t, f) => setStatus(set, t.id, "downloading", f))
    for (const t of todo) {
      if (get().status[t.id] === "downloading") setStatus(set, t.id, "done", 1)
    }
    await get().refreshBytes()
  },

  downloadAll: async () => {
    const res = await fetch("/api/library/manifest")
    if (!res.ok) return
    const { tracks } = (await res.json()) as { tracks: PlayableTrack[] }
    await get().downloadTracks(tracks)
  },

  remove: async (id) => {
    await dbDeleteTrack(id)
    setStatus(set, id, null)
    await get().refreshBytes()
  },

  refreshBytes: async () => {
    set({ bytesUsed: await totalBytes() })
  },
}))
