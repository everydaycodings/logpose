"use client"

import {
  CheckCircle,
  CircleNotch,
  DownloadSimple,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { PlayableTrack } from "@/lib/types"
import { useDownloads } from "@/store/downloads"

// Download action for the per-track "…" menu.
export function DownloadMenuItem({ track }: { track: PlayableTrack }) {
  const status = useDownloads((s) => s.status[track.id])
  const download = useDownloads((s) => s.download)
  const remove = useDownloads((s) => s.remove)

  if (status === "downloading") {
    return (
      <DropdownMenuItem disabled>
        <CircleNotch className="size-4 animate-spin" /> Downloading…
      </DropdownMenuItem>
    )
  }
  if (status === "done") {
    return (
      <DropdownMenuItem onSelect={() => void remove(track.id)}>
        <CheckCircle weight="fill" className="size-4 text-seal" /> Remove
        download
      </DropdownMenuItem>
    )
  }
  return (
    <DropdownMenuItem onSelect={() => void download(track)}>
      <DownloadSimple className="size-4" /> Download
    </DropdownMenuItem>
  )
}

// Header action for albums/playlists: downloads (or removes) a whole set.
export function DownloadCollectionButton({ tracks }: { tracks: PlayableTrack[] }) {
  const status = useDownloads((s) => s.status)
  const downloadTracks = useDownloads((s) => s.downloadTracks)
  const remove = useDownloads((s) => s.remove)

  if (tracks.length === 0) return null

  const done = tracks.filter((t) => status[t.id] === "done").length
  const downloading = tracks.some((t) => status[t.id] === "downloading")
  const allDone = done === tracks.length

  if (downloading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <CircleNotch className="size-4 animate-spin" />
        Downloading {done}/{tracks.length}
      </Button>
    )
  }

  if (allDone) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-seal"
        onClick={() => tracks.forEach((t) => void remove(t.id))}
      >
        <CheckCircle weight="fill" className="size-4" /> Downloaded
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => void downloadTracks(tracks)}
    >
      <DownloadSimple className="size-4" /> Download
    </Button>
  )
}
