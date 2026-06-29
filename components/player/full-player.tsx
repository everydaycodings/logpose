"use client"

import {
  CaretDown,
  Pause,
  Play,
  Repeat,
  RepeatOnce,
  Shuffle,
  SkipBack,
  SkipForward,
} from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { JollySeal } from "@/components/brand/jolly-seal"
import { Visualizer } from "@/components/player/visualizer"
import { Slider } from "@/components/ui/slider"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { current, usePlayer } from "@/store/player"

export function FullPlayer() {
  const expanded = usePlayer((s) => s.expanded)
  const setExpanded = usePlayer((s) => s.setExpanded)
  const track = usePlayer(current)
  const isPlaying = usePlayer((s) => s.isPlaying)
  const togglePlay = usePlayer((s) => s.togglePlay)
  const next = usePlayer((s) => s.next)
  const prev = usePlayer((s) => s.prev)
  const shuffle = usePlayer((s) => s.shuffle)
  const toggleShuffle = usePlayer((s) => s.toggleShuffle)
  const repeat = usePlayer((s) => s.repeat)
  const cycleRepeat = usePlayer((s) => s.cycleRepeat)
  const positionMs = usePlayer((s) => s.positionMs)
  const durationMs = usePlayer((s) => s.durationMs)
  const seek = usePlayer((s) => s.seek)
  const crossfadeSec = usePlayer((s) => s.crossfadeSec)
  const setCrossfade = usePlayer((s) => s.setCrossfade)

  const [lyrics, setLyrics] = useState<string | null>(null)
  const [showLyrics, setShowLyrics] = useState(false)

  useEffect(() => {
    if (!track) return
    setLyrics(null)
    setShowLyrics(false)
    fetch(`/api/tracks/${track.id}/lyrics`)
      .then((r) => r.json())
      .then((d) => setLyrics(d.lyrics))
      .catch(() => {})
  }, [track?.id, track])

  // Close on Escape.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded, setExpanded])

  if (!track) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background transition-transform duration-300 ease-out",
        expanded ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!expanded}
    >
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Close now playing"
          className="rounded-full p-2 hover:bg-accent"
        >
          <CaretDown className="size-5" />
        </button>
        <span className="font-heading text-xl text-muted-foreground">
          Now Playing
        </span>
        <button
          type="button"
          onClick={() => setShowLyrics((v) => !v)}
          aria-pressed={showLyrics}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm hover:bg-accent",
            showLyrics ? "text-seal" : "text-muted-foreground",
            !lyrics && "invisible",
          )}
        >
          Lyrics
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-6">
        {showLyrics && lyrics ? (
          <div className="h-full w-full overflow-y-auto whitespace-pre-wrap text-center text-lg leading-relaxed text-foreground/90">
            {lyrics}
          </div>
        ) : (
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-muted shadow-xl">
            {track.hasCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/cover/${track.id}`}
                alt={track.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <JollySeal className="size-1/2 opacity-25" />
              </div>
            )}
          </div>
        )}

        <div className="w-full text-center">
          <h2 className="truncate font-heading text-4xl">{track.title}</h2>
          <p className="truncate text-muted-foreground">
            {track.artist ?? "Unknown artist"}
            {track.album ? ` · ${track.album}` : ""}
          </p>
        </div>

        <Visualizer className="h-10 w-full max-w-sm" />

        <div className="w-full max-w-sm">
          <Slider
            value={[Math.min(positionMs, durationMs || positionMs)]}
            max={durationMs || 1}
            step={500}
            onValueChange={([v]) => seek(v ?? 0)}
            aria-label="Seek"
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{formatTime(positionMs)}</span>
            <span>{formatTime(durationMs)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="Shuffle"
            aria-pressed={shuffle}
            className={cn("p-2", shuffle ? "text-seal" : "text-muted-foreground")}
          >
            <Shuffle className="size-5" />
          </button>
          <button type="button" onClick={prev} aria-label="Previous" className="p-2">
            <SkipBack weight="fill" className="size-7" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="rounded-full bg-primary p-4 text-primary-foreground hover:opacity-90"
          >
            {isPlaying ? (
              <Pause weight="fill" className="size-7" />
            ) : (
              <Play weight="fill" className="size-7" />
            )}
          </button>
          <button type="button" onClick={next} aria-label="Next" className="p-2">
            <SkipForward weight="fill" className="size-7" />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
            className={cn(
              "p-2",
              repeat !== "off" ? "text-seal" : "text-muted-foreground",
            )}
          >
            {repeat === "one" ? (
              <RepeatOnce className="size-5" />
            ) : (
              <Repeat className="size-5" />
            )}
          </button>
        </div>

        <label className="flex w-full max-w-sm items-center gap-3 text-xs text-muted-foreground">
          <span className="whitespace-nowrap">Crossfade</span>
          <Slider
            value={[crossfadeSec]}
            max={12}
            step={1}
            onValueChange={([v]) => setCrossfade(v ?? 0)}
            aria-label="Crossfade seconds"
          />
          <span className="w-8 tabular-nums">{crossfadeSec}s</span>
        </label>
      </div>
    </div>
  )
}
