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
  getLeastPlayed,
  getMostPlayed,
  getPlaylists,
  getRecentlyPlayed,
  getRecentTracks,
} from "@/lib/services/queries"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default async function HomePage() {
  const [recent, albums, artists, playlists, mostPlayed, leastPlayed, recentlyPlayed] =
    await Promise.all([
      getRecentTracks(12),
      getAlbums(),
      getArtists(),
      getPlaylists(),
      getMostPlayed(6),
      getLeastPlayed(6),
      getRecentlyPlayed(6),
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

      {(mostPlayed.length > 0 || leastPlayed.length > 0) && (
        <div className="grid gap-x-8 md:grid-cols-2">
          {mostPlayed.length > 0 && (
            <Section title="On repeat">
              <div className="rounded-2xl bg-card/50 p-2">
                <TrackList tracks={mostPlayed} showPlayCount showCover={false} />
              </div>
            </Section>
          )}
          {leastPlayed.length > 0 && (
            <Section title="Hidden gems">
              <div className="rounded-2xl bg-card/50 p-2">
                <TrackList tracks={leastPlayed} showPlayCount showCover={false} />
              </div>
            </Section>
          )}
        </div>
      )}

      {recentlyPlayed.length > 0 && (
        <Section title="Recently played">
          <div className="rounded-2xl bg-card/50 p-2">
            <TrackList tracks={recentlyPlayed} showCover />
          </div>
        </Section>
      )}

      {albums.length > 0 && (
        <Section title="Albums">
          <CardGrid>
            {albums.slice(0, 12).map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </CardGrid>
        </Section>
      )}

      {artists.length > 0 && (
        <Section title="Artists">
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
