import type { Metadata } from "next"
import { EmptyState } from "@/components/library/empty-state"
import { PlayAllButton } from "@/components/library/play-all-button"
import { TrackList } from "@/components/library/track-list"
import { getLikedTracks } from "@/lib/services/queries"

export const metadata: Metadata = { title: "Liked" }

export default async function LikedPage() {
  const tracks = await getLikedTracks()

  if (tracks.length === 0) {
    return (
      <EmptyState
        title="No favorites yet"
        message="Tap the heart on any song and it'll wash up here."
      />
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-5xl">Liked Songs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tracks.length} {tracks.length === 1 ? "song" : "songs"}
          </p>
        </div>
        <PlayAllButton tracks={tracks} />
      </div>
      <div className="rounded-2xl bg-card/50 p-2">
        <TrackList tracks={tracks} numbered />
      </div>
    </div>
  )
}
