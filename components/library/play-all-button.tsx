"use client"

import { Play, Shuffle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { PlayableTrack } from "@/lib/types"
import { usePlayer } from "@/store/player"

/** "Play" + "Shuffle" buttons for a collection (album, playlist, etc.). */
export function PlayAllButton({ tracks }: { tracks: PlayableTrack[] }) {
  const playQueue = usePlayer((s) => s.playQueue)
  const shuffle = usePlayer((s) => s.shuffle)
  const toggleShuffle = usePlayer((s) => s.toggleShuffle)

  if (tracks.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => playQueue(tracks, 0)} className="gap-2">
        <Play weight="fill" className="size-4" /> Play
      </Button>
      <Button
        variant="secondary"
        className="gap-2"
        onClick={() => {
          if (!shuffle) toggleShuffle()
          playQueue(tracks, Math.floor(Math.random() * tracks.length))
        }}
      >
        <Shuffle className="size-4" /> Shuffle
      </Button>
    </div>
  )
}
