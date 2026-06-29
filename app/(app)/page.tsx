import { EmptyState } from "@/components/library/empty-state"
import {
  AlbumCard,
  ArtistCard,
  CardGrid,
  PlaylistCard,
} from "@/components/library/media-cards"
import { TrackList } from "@/components/library/track-list"
import { Section } from "@/components/layout/section"
import {
  getAlbums,
  getArtists,
  getPlaylists,
  getRecentlyPlayed,
  getRecentTracks,
  getSongsPreview,
} from "@/lib/services/queries"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default async function HomePage() {
  const [recent, recentlyPlayed, songs, albums, artists, playlists] =
    await Promise.all([
      getRecentTracks(8),
      getRecentlyPlayed(8),
      getSongsPreview(7),
      getAlbums(),
      getArtists(),
      getPlaylists(),
    ])

  if (recent.length === 0) {
    return (
      <EmptyState
        title="Set sail"
        message="Your harbor is empty. Add a song from a file or a YouTube link to begin your collection."
        actionLabel="Add music"
        actionHref="/import"
      />
    )
  }

  return (
    <div>
      <h1 className="mb-8 font-heading text-5xl">{greeting()}</h1>

      <Section title="Recently added">
        <div className="rounded-2xl bg-card/50 p-2">
          <TrackList tracks={recent} numbered />
        </div>
      </Section>

      {recentlyPlayed.length > 0 && (
        <Section title="Recently played">
          <div className="rounded-2xl bg-card/50 p-2">
            <TrackList tracks={recentlyPlayed} showCover />
          </div>
        </Section>
      )}

      <Section title="Songs" href="/songs">
        <div className="rounded-2xl bg-card/50 p-2">
          <TrackList tracks={songs} />
        </div>
      </Section>

      {albums.length > 0 && (
        <Section title="Albums" href="/albums">
          <CardGrid>
            {albums.slice(0, 12).map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </CardGrid>
        </Section>
      )}

      {artists.length > 0 && (
        <Section title="Artists" href="/artists">
          <CardGrid>
            {artists.slice(0, 12).map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </CardGrid>
        </Section>
      )}

      {playlists.length > 0 && (
        <Section title="Playlists">
          <CardGrid>
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </CardGrid>
        </Section>
      )}
    </div>
  )
}
