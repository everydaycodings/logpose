"use client"

import { useRouter } from "next/navigation"
import { TrackList } from "@/components/library/track-list"
import { removeTrackFromPlaylist } from "@/lib/actions"
import type { PlayableTrack } from "@/lib/types"

export function PlaylistTracks({
  playlistId,
  tracks,
}: {
  playlistId: string
  tracks: PlayableTrack[]
}) {
  const router = useRouter()
  return (
    <TrackList
      tracks={tracks}
      numbered
      showCover
      onRemove={async (trackId) => {
        await removeTrackFromPlaylist(playlistId, trackId)
        router.refresh()
      }}
    />
  )
}
