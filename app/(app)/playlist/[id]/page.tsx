import { notFound } from "next/navigation"
import { CollectionHeader } from "@/components/library/collection-header"
import { PlayAllButton } from "@/components/library/play-all-button"
import { PlaylistActions } from "@/components/playlists/playlist-actions"
import { PlaylistTracks } from "@/components/playlists/playlist-tracks"
import { getPlaylist } from "@/lib/services/queries"

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const playlist = await getPlaylist(id)
  if (!playlist) notFound()

  return (
    <div>
      <CollectionHeader
        eyebrow="Playlist"
        title={playlist.name}
        coverTrackId={playlist.tracks[0]?.id ?? null}
        subtitle={`${playlist.tracks.length} ${playlist.tracks.length === 1 ? "song" : "songs"}`}
      >
        <div className="flex items-center gap-2">
          <PlayAllButton tracks={playlist.tracks} />
          <PlaylistActions id={playlist.id} name={playlist.name} />
        </div>
      </CollectionHeader>

      <div className="rounded-2xl bg-card/50 p-2">
        {playlist.tracks.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            This playlist is empty. Add songs from the “…” menu on any track.
          </p>
        ) : (
          <PlaylistTracks playlistId={playlist.id} tracks={playlist.tracks} />
        )}
      </div>
    </div>
  )
}
