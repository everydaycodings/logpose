"use client"

import { MagnifyingGlass } from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import { TrackList } from "@/components/library/track-list"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PlayableTrack } from "@/lib/types"

type Sort = "relevance" | "title" | "artist" | "duration"

export function SearchClient() {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<PlayableTrack[]>([])
  const [sort, setSort] = useState<Sort>("relevance")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const query = q.trim()
    if (!query) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.tracks ?? [])
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const sorted = useMemo(() => {
    if (sort === "relevance") return results
    const copy = [...results]
    copy.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title)
      if (sort === "artist")
        return (a.artist ?? "").localeCompare(b.artist ?? "")
      return (a.durationMs ?? 0) - (b.durationMs ?? 0)
    })
    return copy
  }, [results, sort])

  return (
    <div>
      <h1 className="mb-4 font-heading text-5xl">Search</h1>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Songs, artists, albums…"
            className="h-11 pl-9"
            aria-label="Search"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="title">Title (A–Z)</SelectItem>
            <SelectItem value="artist">Artist (A–Z)</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {q.trim() === "" ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Find anything in your harbor.
        </p>
      ) : loading && results.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Searching…
        </p>
      ) : sorted.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No matches for “{q}”.
        </p>
      ) : (
        <div className="rounded-2xl bg-card/50 p-2">
          <TrackList tracks={sorted} />
        </div>
      )}
    </div>
  )
}
