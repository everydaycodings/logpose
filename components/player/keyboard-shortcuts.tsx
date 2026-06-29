"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toggleLike } from "@/lib/actions"
import { current, usePlayer } from "@/store/player"

const SHORTCUTS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← / →", "Seek 5s back / forward"],
  ["Shift + ← / →", "Previous / next track"],
  ["↑ / ↓", "Volume up / down"],
  ["M", "Mute"],
  ["L", "Like current track"],
  ["S", "Shuffle"],
  ["R", "Repeat mode"],
  ["F", "Open / close now playing"],
  ["?", "This help"],
]

function isTyping(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false
  return (
    t.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)
  )
}

export function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const p = usePlayer.getState()

      switch (e.key) {
        case " ":
          e.preventDefault()
          p.togglePlay()
          break
        case "ArrowRight":
          e.preventDefault()
          if (e.shiftKey) p.next()
          else p.seek(p.positionMs + 5000)
          break
        case "ArrowLeft":
          e.preventDefault()
          if (e.shiftKey) p.prev()
          else p.seek(Math.max(0, p.positionMs - 5000))
          break
        case "ArrowUp":
          e.preventDefault()
          p.setVolume(Math.min(1, p.volume + 0.05))
          break
        case "ArrowDown":
          e.preventDefault()
          p.setVolume(Math.max(0, p.volume - 0.05))
          break
        case "m":
          p.toggleMute()
          break
        case "s":
          p.toggleShuffle()
          break
        case "r":
          p.cycleRepeat()
          break
        case "f":
          p.setExpanded(!p.expanded)
          break
        case "l": {
          const track = current(p)
          if (track) {
            toggleLike(track.id)
            toast.success(`Liked ${track.title}`)
          }
          break
        }
        case "?":
          setHelpOpen((v) => !v)
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="contents">
              <dt>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
                  {key}
                </kbd>
              </dt>
              <dd className="text-muted-foreground">{desc}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
