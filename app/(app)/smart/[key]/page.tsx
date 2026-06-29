import { notFound } from "next/navigation"
import { CollectionHeader } from "@/components/library/collection-header"
import { EmptyState } from "@/components/library/empty-state"
import { PlayAllButton } from "@/components/library/play-all-button"
import { TrackList } from "@/components/library/track-list"
import {
  getAllTracks,
  getLeastPlayed,
  getMostPlayed,
  getRecentlyPlayed,
} from "@/lib/services/queries"
import { SMART_MIXES, type SmartKey } from "@/lib/smart"
import type { PlayableTrack } from "@/lib/types"

// Server-only loaders (kept out of lib/smart.ts so the client sidebar can
// import the metadata without pulling in the database layer).
const LOADERS: Record<SmartKey, () => Promise<PlayableTrack[]>> = {
  "most-played": () => getMostPlayed(100),
  "recently-added": () => getAllTracks(),
  "recently-played": () => getRecentlyPlayed(100),
  "hidden-gems": () => getLeastPlayed(100),
}

export default async function SmartPlaylistPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  const mix = SMART_MIXES[key as SmartKey]
  if (!mix) notFound()

  const tracks = await LOADERS[key as SmartKey]()

  if (tracks.length === 0) {
    return <EmptyState title={mix.title} message="Nothing here yet." />
  }

  return (
    <div>
      <CollectionHeader
        eyebrow="Mix"
        title={mix.title}
        coverTrackId={tracks[0]?.id ?? null}
        subtitle={`${mix.blurb} · ${tracks.length} songs`}
      >
        <PlayAllButton tracks={tracks} />
      </CollectionHeader>
      <div className="rounded-2xl bg-card/50 p-2">
        <TrackList tracks={tracks} numbered showPlayCount={key !== "recently-added"} />
      </div>
    </div>
  )
}
