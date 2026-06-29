"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { type LrcLine, parseLrc } from "@/lib/lrc"
import { cn } from "@/lib/utils"
import { usePlayer } from "@/store/player"

export function LyricsView({ trackId }: { trackId: string }) {
  const [synced, setSynced] = useState<string | null>(null)
  const [plain, setPlain] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const positionMs = usePlayer((s) => s.positionMs)
  const seek = usePlayer((s) => s.seek)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    setLoading(true)
    setSynced(null)
    setPlain(null)
    fetch(`/api/tracks/${trackId}/lyrics`)
      .then((r) => r.json())
      .then((d) => {
        setSynced(d.synced)
        setPlain(d.lyrics)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [trackId])

  const lines: LrcLine[] = useMemo(
    () => (synced ? parseLrc(synced) : []),
    [synced],
  )

  const activeIndex = useMemo(() => {
    if (lines.length === 0) return -1
    let idx = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.timeMs <= positionMs + 250) idx = i
      else break
    }
    return idx
  }, [lines, positionMs])

  // Keep the active line centered.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [activeIndex])

  async function autoFetch() {
    setFetching(true)
    const res = await fetch(`/api/tracks/${trackId}/lyrics`, { method: "POST" })
    if (res.ok) {
      const d = await res.json()
      setSynced(d.synced)
      setPlain(d.lyrics)
    }
    setFetching(false)
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading lyrics…</p>
  }

  if (lines.length > 0) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto py-[40%] text-center"
      >
        {lines.map((line, i) => (
          <p
            key={i}
            ref={i === activeIndex ? activeRef : undefined}
            onClick={() => seek(line.timeMs)}
            className={cn(
              "cursor-pointer py-1.5 text-xl leading-relaxed transition-all",
              i === activeIndex
                ? "font-semibold text-seal"
                : "text-foreground/40 hover:text-foreground/70",
            )}
          >
            {line.text || "♪"}
          </p>
        ))}
      </div>
    )
  }

  if (plain) {
    return (
      <div className="h-full w-full overflow-y-auto whitespace-pre-wrap text-center text-lg leading-relaxed text-foreground/90">
        {plain}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">No lyrics yet.</p>
      <Button variant="secondary" onClick={autoFetch} disabled={fetching}>
        {fetching ? "Searching…" : "Find lyrics"}
      </Button>
    </div>
  )
}
