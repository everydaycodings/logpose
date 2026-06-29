import { notFound } from "next/navigation"
import { CollectionHeader } from "@/components/library/collection-header"
import { AlbumCard, CardGrid } from "@/components/library/media-cards"
import { PlayAllButton } from "@/components/library/play-all-button"
import { TrackList } from "@/components/library/track-list"
import { Section } from "@/components/layout/section"
import { getArtist } from "@/lib/services/queries"

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const artist = await getArtist(id)
  if (!artist) notFound()

  return (
    <div>
      <CollectionHeader
        eyebrow="Artist"
        title={artist.name}
        round
        coverSrc={`/api/artists/${artist.id}/cover`}
        editHref={`/artist/${artist.id}/edit`}
        subtitle={`${artist.tracks.length} ${artist.tracks.length === 1 ? "song" : "songs"}`}
      >
        <PlayAllButton tracks={artist.tracks} />
      </CollectionHeader>

      {artist.albums.length > 0 && (
        <Section title="Albums">
          <CardGrid>
            {artist.albums.map((al) => (
              <AlbumCard
                key={al.id}
                album={{
                  id: al.id,
                  title: al.title,
                  artist: artist.name,
                  year: al.year,
                  trackId: al.trackId,
                }}
              />
            ))}
          </CardGrid>
        </Section>
      )}

      <Section title="Songs">
        <div className="rounded-2xl bg-card/50 p-2">
          <TrackList tracks={artist.tracks} numbered showCover={false} />
        </div>
      </Section>
    </div>
  )
}
