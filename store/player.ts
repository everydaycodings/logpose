import { create } from "zustand"
import type { PlayableTrack } from "@/lib/types"

export type RepeatMode = "off" | "all" | "one"

// Equalizer band center frequencies (Hz).
export const EQ_BANDS = [60, 170, 350, 1000, 3500, 10000]

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0],
  Bass: [6, 4, 2, 0, 0, 0],
  Treble: [0, 0, 0, 2, 4, 6],
  Vocal: [-2, 0, 3, 4, 2, 0],
  Loudness: [5, 2, 0, 0, 2, 5],
  "Lo-fi": [4, 2, 0, -2, -5, -8],
}

const PREFS_KEY = "logpose-prefs"
const SESSION_KEY = "logpose-session"

type Prefs = {
  volume: number
  crossfadeSec: number
  eq: number[]
  eqEnabled: boolean
}

function loadPrefs(): Partial<Prefs> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function savePrefs(p: Prefs) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

// The queue/up-next so a page reload doesn't lose what you were listening to.
// Restored paused, at the start of the track that was current.
type Session = {
  queue: PlayableTrack[]
  ordered: PlayableTrack[] | null
  index: number
  shuffle: boolean
  repeat: RepeatMode
}

function loadSession(): Partial<Session> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function saveSession(s: Session) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

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
  eq: number[]
  eqEnabled: boolean

  positionMs: number
  durationMs: number

  // Sleep timer: pause at a timestamp, or when the current track ends.
  sleepAt: number | null
  sleepEndOfTrack: boolean

  // Full-screen now-playing view.
  expanded: boolean
  // Transient seek target the player provider consumes and clears.
  seekTarget: number | null
  // Bumped each time the current track restarts in place (a loop), so the
  // engine records another play even though the track id didn't change.
  playToken: number

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
  setEqBand: (index: number, gain: number) => void
  setEqPreset: (name: string) => void
  toggleEq: () => void
  setSleepTimer: (minutes: number | null) => void
  setSleepEndOfTrack: (v: boolean) => void
  seek: (ms: number) => void
  clearSeek: () => void
  setProgress: (positionMs: number, durationMs: number) => void
  setExpanded: (v: boolean) => void
  /** Restore the saved queue from localStorage — called once, post-hydration. */
  hydrateSession: () => void
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

function persist(get: () => PlayerState) {
  const s = get()
  savePrefs({
    volume: s.volume,
    crossfadeSec: s.crossfadeSec,
    eq: s.eq,
    eqEnabled: s.eqEnabled,
  })
}

export const usePlayer = create<PlayerState>((set, get) => ({
  // Always start empty so server and client first-render match; the saved
  // session is restored after hydration via hydrateSession().
  queue: [],
  ordered: null,
  index: 0,
  isPlaying: false,
  shuffle: false,
  repeat: "off",
  volume: loadPrefs().volume ?? 1,
  muted: false,
  crossfadeSec: loadPrefs().crossfadeSec ?? 0,
  eq: loadPrefs().eq ?? [0, 0, 0, 0, 0, 0],
  eqEnabled: loadPrefs().eqEnabled ?? false,
  positionMs: 0,
  durationMs: 0,
  sleepAt: null,
  sleepEndOfTrack: false,
  expanded: false,
  seekTarget: null,
  playToken: 0,

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
      // Wrapping to a different track changes the loaded id (engine reloads);
      // a single-track queue stays on the same id, so restart it in place.
      if (s.index === 0) {
        set({ seekTarget: 0, positionMs: 0, isPlaying: true, playToken: s.playToken + 1 })
      } else {
        set({ index: 0, positionMs: 0, isPlaying: true })
      }
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
    if (s.sleepEndOfTrack) {
      set({ isPlaying: false, sleepEndOfTrack: false })
      return
    }
    if (s.repeat === "one") {
      set({ seekTarget: 0, positionMs: 0, isPlaying: true, playToken: s.playToken + 1 })
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

  setVolume: (v) => {
    const volume = Math.min(1, Math.max(0, v))
    set({ volume, muted: false })
    persist(get)
  },
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setCrossfade: (sec) => {
    set({ crossfadeSec: Math.min(12, Math.max(0, sec)) })
    persist(get)
  },
  setEqBand: (index, gain) => {
    const eq = [...get().eq]
    eq[index] = Math.max(-12, Math.min(12, gain))
    set({ eq, eqEnabled: true })
    persist(get)
  },
  setEqPreset: (name) => {
    const preset = EQ_PRESETS[name]
    if (!preset) return
    set({ eq: [...preset], eqEnabled: true })
    persist(get)
  },
  toggleEq: () => {
    set((s) => ({ eqEnabled: !s.eqEnabled }))
    persist(get)
  },
  setSleepTimer: (minutes) =>
    set({
      sleepAt: minutes == null ? null : Date.now() + minutes * 60000,
      sleepEndOfTrack: false,
    }),
  setSleepEndOfTrack: (v) => set({ sleepEndOfTrack: v, sleepAt: null }),

  seek: (ms) => set({ seekTarget: Math.max(0, ms), positionMs: Math.max(0, ms) }),
  clearSeek: () => set({ seekTarget: null }),
  setProgress: (positionMs, durationMs) => set({ positionMs, durationMs }),
  setExpanded: (v) => set({ expanded: v }),

  hydrateSession: () => {
    if (get().queue.length > 0) return
    const saved = loadSession()
    if (!saved.queue || saved.queue.length === 0) return
    set({
      queue: saved.queue,
      ordered: saved.ordered ?? null,
      index: saved.index ?? 0,
      shuffle: saved.shuffle ?? false,
      repeat: saved.repeat ?? "off",
    })
  },

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

// Persist the queue/up-next across reloads. Only writes when the queue or its
// ordering actually changes — not on every progress tick.
let lastSnap: Pick<
  PlayerState,
  "queue" | "ordered" | "index" | "shuffle" | "repeat"
> | null = null
usePlayer.subscribe((s) => {
  if (
    lastSnap &&
    s.queue === lastSnap.queue &&
    s.ordered === lastSnap.ordered &&
    s.index === lastSnap.index &&
    s.shuffle === lastSnap.shuffle &&
    s.repeat === lastSnap.repeat
  ) {
    return
  }
  lastSnap = {
    queue: s.queue,
    ordered: s.ordered,
    index: s.index,
    shuffle: s.shuffle,
    repeat: s.repeat,
  }
  saveSession(lastSnap)
})
