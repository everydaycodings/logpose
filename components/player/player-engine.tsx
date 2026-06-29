"use client"

import { useEffect, useRef } from "react"
import { audioGraph } from "@/lib/player/audio-graph"
import { coverUrl, streamUrl } from "@/lib/types"
import { current, nextTrack, usePlayer } from "@/store/player"

/**
 * Headless audio engine. Renders two hidden <audio> elements and drives them
 * from the Zustand store. Two elements + per-source gain nodes enable
 * crossfade; with crossfade = 0 it behaves as a normal (near-gapless) player.
 *
 * Rendered once, high in the app tree.
 */
export function PlayerEngine() {
  const els = useRef<(HTMLAudioElement | null)[]>([null, null])
  const ctxRef = useRef<AudioContext | null>(null)
  const gainsRef = useRef<GainNode[]>([])
  const masterRef = useRef<GainNode | null>(null)
  const activeRef = useRef(0)
  const loadedIdRef = useRef<string | null>(null)
  const crossfadingRef = useRef(false)
  const adoptRef = useRef(false)

  // Build the Web Audio graph lazily (must follow a user gesture).
  function ensureGraph() {
    if (ctxRef.current) return
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new Ctx()
    const master = ctx.createGain()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    master.connect(analyser)
    analyser.connect(ctx.destination)
    const gains = els.current.map((el) => {
      const src = ctx.createMediaElementSource(el!)
      const gain = ctx.createGain()
      src.connect(gain)
      gain.connect(master)
      return gain
    })
    ctxRef.current = ctx
    masterRef.current = master
    gainsRef.current = gains
    audioGraph.analyser = analyser
  }

  function activeEl() {
    return els.current[activeRef.current]!
  }

  // --- Load current track when it changes ---
  const cur = usePlayer(current)
  useEffect(() => {
    if (!cur) {
      loadedIdRef.current = null
      els.current.forEach((el) => el?.pause())
      return
    }
    if (adoptRef.current) {
      // Audio for this track is already playing (we crossfaded into it).
      adoptRef.current = false
      loadedIdRef.current = cur.id
      updateMediaSession(cur)
      return
    }
    if (loadedIdRef.current === cur.id) return

    ensureGraph()
    const el = activeEl()
    const idx = activeRef.current
    gainsRef.current[idx]?.gain.setValueAtTime(1, ctxRef.current!.currentTime)
    gainsRef.current[1 - idx]?.gain.setValueAtTime(0, ctxRef.current!.currentTime)
    el.src = streamUrl(cur.id)
    el.currentTime = 0
    loadedIdRef.current = cur.id
    crossfadingRef.current = false
    if (usePlayer.getState().isPlaying) {
      void ctxRef.current?.resume()
      void el.play().catch(() => {})
      void fetch(`/api/tracks/${cur.id}/play`, { method: "POST" }).catch(
        () => {},
      )
    }
    updateMediaSession(cur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id])

  // --- Play / pause ---
  const isPlaying = usePlayer((s) => s.isPlaying)
  useEffect(() => {
    if (!cur) return
    const el = activeEl()
    if (isPlaying) {
      ensureGraph()
      void ctxRef.current?.resume()
      void el.play().catch(() => {})
    } else {
      el.pause()
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, cur?.id])

  // --- Volume / mute ---
  const volume = usePlayer((s) => s.volume)
  const muted = usePlayer((s) => s.muted)
  useEffect(() => {
    const m = masterRef.current
    if (m && ctxRef.current) {
      m.gain.setTargetAtTime(muted ? 0 : volume, ctxRef.current.currentTime, 0.02)
    }
  }, [volume, muted])

  // --- Seek requests ---
  const seekTarget = usePlayer((s) => s.seekTarget)
  const clearSeek = usePlayer((s) => s.clearSeek)
  useEffect(() => {
    if (seekTarget == null) return
    const el = activeEl()
    if (Number.isFinite(el.duration)) el.currentTime = seekTarget / 1000
    crossfadingRef.current = false
    clearSeek()
  }, [seekTarget, clearSeek])

  // --- Progress + crossfade scheduling (driven by timeupdate) ---
  function onTimeUpdate() {
    const el = activeEl()
    const posMs = el.currentTime * 1000
    const durMs = Number.isFinite(el.duration) ? el.duration * 1000 : 0
    usePlayer.getState().setProgress(posMs, durMs)

    const s = usePlayer.getState()
    const cf = s.crossfadeSec
    if (cf > 0 && durMs > 0 && !crossfadingRef.current) {
      const remaining = (el.duration - el.currentTime) * 1000
      const upcoming = nextTrack(s)
      if (upcoming && remaining <= cf * 1000) startCrossfade(upcoming.id)
    }
  }

  function startCrossfade(nextId: string) {
    const ctx = ctxRef.current
    if (!ctx) return
    crossfadingRef.current = true
    const from = activeRef.current
    const to = 1 - from
    const other = els.current[to]!
    other.src = streamUrl(nextId)
    other.currentTime = 0
    void other.play().catch(() => {})
    void fetch(`/api/tracks/${nextId}/play`, { method: "POST" }).catch(() => {})

    const now = ctx.currentTime
    const cf = usePlayer.getState().crossfadeSec
    gainsRef.current[from]?.gain.setValueAtTime(1, now)
    gainsRef.current[from]?.gain.linearRampToValueAtTime(0, now + cf)
    gainsRef.current[to]?.gain.setValueAtTime(0, now)
    gainsRef.current[to]?.gain.linearRampToValueAtTime(1, now + cf)

    window.setTimeout(() => {
      activeRef.current = to
      adoptRef.current = true
      els.current[from]?.pause()
      usePlayer.getState().next()
    }, cf * 1000)
  }

  function onEnded() {
    if (crossfadingRef.current) return
    usePlayer.getState().trackEnded()
  }

  // --- Media Session controls (lock screen / background) ---
  function updateMediaSession(track: NonNullable<typeof cur>) {
    if (!("mediaSession" in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist ?? "Unknown",
      album: track.album ?? "",
      artwork: track.hasCover
        ? [{ src: coverUrl(track.id), sizes: "500x500", type: "image/jpeg" }]
        : [],
    })
  }

  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    const ms = navigator.mediaSession
    ms.setActionHandler("play", () => usePlayer.getState().setPlaying(true))
    ms.setActionHandler("pause", () => usePlayer.getState().setPlaying(false))
    ms.setActionHandler("nexttrack", () => usePlayer.getState().next())
    ms.setActionHandler("previoustrack", () => usePlayer.getState().prev())
    ms.setActionHandler("seekto", (d) => {
      if (d.seekTime != null) usePlayer.getState().seek(d.seekTime * 1000)
    })
    return () => {
      ;["play", "pause", "nexttrack", "previoustrack", "seekto"].forEach((a) =>
        ms.setActionHandler(a as MediaSessionAction, null),
      )
    }
  }, [])

  return (
    <>
      <audio
        ref={(el) => {
          els.current[0] = el
        }}
        onTimeUpdate={() => activeRef.current === 0 && onTimeUpdate()}
        onEnded={() => activeRef.current === 0 && onEnded()}
        preload="auto"
        hidden
      />
      <audio
        ref={(el) => {
          els.current[1] = el
        }}
        onTimeUpdate={() => activeRef.current === 1 && onTimeUpdate()}
        onEnded={() => activeRef.current === 1 && onEnded()}
        preload="auto"
        hidden
      />
    </>
  )
}
