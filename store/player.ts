import { create } from "zustand"
import type { PlayableTrack } from "@/lib/types"

export type RepeatMode = "off" | "all" | "one"

type PlayerState = {
  queue: PlayableTrack[]
  // Snapshot of the unshuffled order, restored when shuffle is turned off.
  ordered: PlayableTrack[] | null
  index: number

  isPlaying: boolean
  shuffle: boolean
  repeat: RepeatMode
  volume: number
  muted: boolean
  crossfadeSec: number

  positionMs: number
  durationMs: number

  // Full-screen now-playing view.
  expanded: boolean
  // Transient seek target the player provider consumes and clears.
  seekTarget: number | null

  // --- actions ---
  playQueue: (tracks: PlayableTrack[], startIndex?: number) => void
  togglePlay: () => void
  setPlaying: (v: boolean) => void
  next: () => void
  prev: () => void
  /** Called by the engine when a track ends naturally. */
  trackEnded: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
  setCrossfade: (sec: number) => void
  seek: (ms: number) => void
  clearSeek: () => void
  setProgress: (positionMs: number, durationMs: number) => void
  setExpanded: (v: boolean) => void
  enqueue: (track: PlayableTrack, playNext?: boolean) => void
  removeAt: (index: number) => void
  reorder: (from: number, to: number) => void
  jumpTo: (index: number) => void
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export const current = (s: PlayerState): PlayableTrack | undefined =>
  s.queue[s.index]

export const nextTrack = (s: PlayerState): PlayableTrack | undefined => {
  if (s.repeat === "one") return s.queue[s.index]
  const ni = s.index + 1
  if (ni < s.queue.length) return s.queue[ni]
  if (s.repeat === "all") return s.queue[0]
  return undefined
}

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  ordered: null,
  index: 0,
  isPlaying: false,
  shuffle: false,
  repeat: "off",
  volume: 1,
  muted: false,
  crossfadeSec: 0,
  positionMs: 0,
  durationMs: 0,
  expanded: false,
  seekTarget: null,

  playQueue: (tracks, startIndex = 0) => {
    if (tracks.length === 0) return
    const { shuffle } = get()
    if (shuffle) {
      const start = tracks[startIndex]!
      const rest = shuffled(tracks.filter((_, i) => i !== startIndex))
      set({
        ordered: tracks,
        queue: [start, ...rest],
        index: 0,
        isPlaying: true,
        positionMs: 0,
      })
    } else {
      set({
        ordered: null,
        queue: tracks,
        index: startIndex,
        isPlaying: true,
        positionMs: 0,
      })
    }
  },

  togglePlay: () => {
    if (get().queue.length === 0) return
    set((s) => ({ isPlaying: !s.isPlaying }))
  },
  setPlaying: (v) => set({ isPlaying: v }),

  next: () => {
    const s = get()
    if (s.queue.length === 0) return
    const ni = s.index + 1
    if (ni < s.queue.length) {
      set({ index: ni, positionMs: 0, isPlaying: true })
    } else if (s.repeat === "all") {
      set({ index: 0, positionMs: 0, isPlaying: true })
    } else {
      set({ isPlaying: false, positionMs: 0 })
    }
  },

  prev: () => {
    const s = get()
    if (s.queue.length === 0) return
    if (s.positionMs > 3000) {
      set({ seekTarget: 0, positionMs: 0 })
      return
    }
    if (s.index > 0) {
      set({ index: s.index - 1, positionMs: 0, isPlaying: true })
    } else if (s.repeat === "all") {
      set({ index: s.queue.length - 1, positionMs: 0, isPlaying: true })
    } else {
      set({ seekTarget: 0, positionMs: 0 })
    }
  },

  trackEnded: () => {
    const s = get()
    if (s.repeat === "one") {
      set({ seekTarget: 0, positionMs: 0, isPlaying: true })
      return
    }
    get().next()
  },

  toggleShuffle: () => {
    const s = get()
    if (!s.shuffle) {
      const cur = s.queue[s.index]
      const rest = shuffled(s.queue.filter((_, i) => i !== s.index))
      set({
        shuffle: true,
        ordered: s.queue,
        queue: cur ? [cur, ...rest] : rest,
        index: 0,
      })
    } else {
      const cur = s.queue[s.index]
      const base = s.ordered ?? s.queue
      const idx = cur ? base.findIndex((t) => t.id === cur.id) : 0
      set({
        shuffle: false,
        queue: base,
        ordered: null,
        index: idx < 0 ? 0 : idx,
      })
    }
  },

  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    })),

  setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)), muted: false }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setCrossfade: (sec) => set({ crossfadeSec: Math.min(12, Math.max(0, sec)) }),

  seek: (ms) => set({ seekTarget: Math.max(0, ms), positionMs: Math.max(0, ms) }),
  clearSeek: () => set({ seekTarget: null }),
  setProgress: (positionMs, durationMs) => set({ positionMs, durationMs }),
  setExpanded: (v) => set({ expanded: v }),

  enqueue: (track, playNext = false) =>
    set((s) => {
      if (s.queue.length === 0) {
        return { queue: [track], index: 0, isPlaying: true }
      }
      const q = [...s.queue]
      const at = playNext ? s.index + 1 : q.length
      q.splice(at, 0, track)
      return { queue: q }
    }),

  removeAt: (index) =>
    set((s) => {
      if (index < 0 || index >= s.queue.length) return s
      const q = s.queue.filter((_, i) => i !== index)
      let idx = s.index
      if (index < s.index) idx -= 1
      else if (index === s.index) idx = Math.min(idx, q.length - 1)
      return { queue: q, index: Math.max(0, idx) }
    }),

  reorder: (from, to) =>
    set((s) => {
      const q = [...s.queue]
      const [moved] = q.splice(from, 1)
      if (!moved) return s
      q.splice(to, 0, moved)
      const curId = s.queue[s.index]?.id
      const idx = curId ? q.findIndex((t) => t.id === curId) : s.index
      return { queue: q, index: idx < 0 ? s.index : idx }
    }),

  jumpTo: (index) => {
    if (index < 0 || index >= get().queue.length) return
    set({ index, positionMs: 0, isPlaying: true })
  },
}))
