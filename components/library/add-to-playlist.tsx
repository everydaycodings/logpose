"use client"

import { Plus } from "@phosphor-icons/react"
import { useState } from "react"
import { toast } from "sonner"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { addTrackToPlaylist, createPlaylist } from "@/lib/actions"

type Playlist = { id: string; name: string }

/** A submenu (used inside a track's dropdown) listing playlists to add to. */
export function AddToPlaylistSub({ trackId }: { trackId: string }) {
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null)

  async function load() {
    if (playlists) return
    const res = await fetch("/api/playlists")
    const data = await res.json()
    setPlaylists(data.playlists ?? [])
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger onPointerEnter={load} onFocus={load}>
        Add to playlist
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem
          onSelect={async () => {
            const name = window.prompt("New playlist name")
            if (!name) return
            const id = await createPlaylist(name)
            if (id) {
              await addTrackToPlaylist(id, trackId)
              toast.success(`Added to ${name}`)
            }
          }}
        >
          <Plus className="size-4" /> New playlist…
        </DropdownMenuItem>
        {playlists && playlists.length > 0 && <DropdownMenuSeparator />}
        {playlists?.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onSelect={async () => {
              await addTrackToPlaylist(p.id, trackId)
              toast.success(`Added to ${p.name}`)
            }}
          >
            {p.name}
          </DropdownMenuItem>
        ))}
        {playlists?.length === 0 && (
          <DropdownMenuItem disabled>No playlists yet</DropdownMenuItem>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
