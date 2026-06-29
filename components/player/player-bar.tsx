"use client"

import {
  CaretUp,
  Pause,
  Play,
  Queue as QueueIcon,
  Repeat,
  RepeatOnce,
  Shuffle,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerX,
} from "@phosphor-icons/react"
import { useState } from "react"
import { FullPlayer } from "@/components/player/full-player"
import { QueuePanel } from "@/components/player/queue-panel"
import { Slider } from "@/components/ui/slider"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { current, usePlayer } from "@/store/player"

export function PlayerBar() {
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
  const setExpanded = usePlayer((s) => s.setExpanded)
  const [queueOpen, setQueueOpen] = useState(false)

  if (!track) return null

  return (
    <>
      <FullPlayer />
      <QueuePanel open={queueOpen} onOpenChange={setQueueOpen} />

      <footer className="border-t border-border bg-card/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-3">
          {/* Now playing */}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Open now playing"
          >
            {track.hasCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/cover/${track.id}`}
                alt=""
                className="size-12 rounded-md object-cover shadow-sm"
              />
            ) : (
              <div className="size-12 rounded-md bg-muted" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{track.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {track.artist ?? "Unknown artist"}
              </div>
            </div>
            <CaretUp className="hidden size-4 shrink-0 text-muted-foreground md:block" />
          </button>

          {/* Transport + seek (center) */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <IconToggle
                active={shuffle}
                onClick={toggleShuffle}
                label="Shuffle"
              >
                <Shuffle className="size-[18px]" />
              </IconToggle>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous"
                className="rounded-full p-2 hover:bg-accent"
              >
                <SkipBack weight="fill" className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="rounded-full bg-primary p-2.5 text-primary-foreground hover:opacity-90"
              >
                {isPlaying ? (
                  <Pause weight="fill" className="size-5" />
                ) : (
                  <Play weight="fill" className="size-5" />
                )}
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next"
                className="rounded-full p-2 hover:bg-accent"
              >
                <SkipForward weight="fill" className="size-[18px]" />
              </button>
              <IconToggle
                active={repeat !== "off"}
                onClick={cycleRepeat}
                label={`Repeat: ${repeat}`}
              >
                {repeat === "one" ? (
                  <RepeatOnce className="size-[18px]" />
                ) : (
                  <Repeat className="size-[18px]" />
                )}
              </IconToggle>
            </div>
            <div className="hidden w-full items-center gap-2 md:flex">
              <span className="w-9 text-right text-[11px] tabular-nums text-muted-foreground">
                {formatTime(positionMs)}
              </span>
              <Slider
                value={[Math.min(positionMs, durationMs || positionMs)]}
                max={durationMs || 1}
                step={500}
                onValueChange={([v]) => seek(v ?? 0)}
                aria-label="Seek"
                className="flex-1"
              />
              <span className="w-9 text-[11px] tabular-nums text-muted-foreground">
                {formatTime(durationMs)}
              </span>
            </div>
          </div>

          {/* Right controls */}
          <div className="hidden items-center justify-end gap-2 md:flex">
            <VolumeControl />
            <button
              type="button"
              onClick={() => setQueueOpen(true)}
              aria-label="Queue"
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <QueueIcon className="size-[18px]" />
            </button>
          </div>

          {/* Mobile play handled above; show compact next */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="justify-self-end rounded-full bg-primary p-2.5 text-primary-foreground md:hidden"
          >
            {isPlaying ? (
              <Pause weight="fill" className="size-5" />
            ) : (
              <Play weight="fill" className="size-5" />
            )}
          </button>
        </div>
      </footer>
    </>
  )
}

function IconToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "rounded-full p-2 hover:bg-accent",
        active ? "text-seal" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}

function VolumeControl() {
  const volume = usePlayer((s) => s.volume)
  const muted = usePlayer((s) => s.muted)
  const setVolume = usePlayer((s) => s.setVolume)
  const toggleMute = usePlayer((s) => s.toggleMute)
  return (
    <div className="flex w-32 items-center gap-2">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="text-muted-foreground hover:text-foreground"
      >
        {muted || volume === 0 ? (
          <SpeakerX className="size-[18px]" />
        ) : (
          <SpeakerHigh className="size-[18px]" />
        )}
      </button>
      <Slider
        value={[muted ? 0 : volume * 100]}
        max={100}
        step={1}
        onValueChange={([v]) => setVolume((v ?? 0) / 100)}
        aria-label="Volume"
      />
    </div>
  )
}
