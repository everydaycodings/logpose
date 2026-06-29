"use client"

import { MagnifyingGlass } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { coverUrl } from "@/lib/types"
import type { PlayableTrack } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePlayer } from "@/store/player"

/**
 * Global quick-search palette. Cmd/Ctrl-K opens it anywhere; typing searches
 * the library and Enter (or click) plays the highlighted track, making the
 * whole result set the new queue.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<PlayableTrack[]>([])
  const [active, setActive] = useState(0)
  const playQueue = usePlayer((s) => s.playQueue)
  const listRef = useRef<HTMLDivElement>(null)

  // Open/close on Cmd/Ctrl-K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Reset when closed.
  useEffect(() => {
    if (!open) {
      setQ("")
      setResults([])
      setActive(0)
    }
  }, [open])

  // Debounced search.
  useEffect(() => {
    const query = q.trim()
    if (!query) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults((data.tracks ?? []).slice(0, 8))
        setActive(0)
      } catch {
        /* ignore */
      }
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  function select(i: number) {
    const track = results[i]
    if (!track) return
    playQueue(results, i)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      select(active)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] max-w-[calc(100%-2rem)] translate-y-0 gap-0 p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Search your library</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search songs, artists, albums…"
            aria-label="Search your library"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
          {results.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(i)}
              onMouseMove={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left",
                i === active && "bg-accent/60",
              )}
            >
              {t.hasCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl(t.id)}
                  alt=""
                  className="size-9 rounded-md object-cover"
                />
              ) : (
                <div className="size-9 rounded-md bg-muted" />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm">{t.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {t.artist ?? "Unknown artist"}
                  {t.album ? ` · ${t.album}` : ""}
                </div>
              </div>
            </button>
          ))}
          {q.trim() !== "" && results.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No matches.
            </p>
          )}
          {q.trim() === "" && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Type to search your harbor.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
