import type { Metadata } from "next"
import { EmptyState } from "@/components/library/empty-state"
import { ArtistCard, CardGrid } from "@/components/library/media-cards"
import { getArtists } from "@/lib/services/queries"

export const metadata: Metadata = { title: "Artists" }

export default async function ArtistsPage() {
  const artists = await getArtists()

  if (artists.length === 0) {
    return (
      <EmptyState
        title="No artists yet"
        message="Import some music and the artists behind it will gather here."
        actionLabel="Add music"
        actionHref="/import"
      />
    )
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-5xl">Artists</h1>
      <CardGrid>
        {artists.map((a) => (
          <ArtistCard key={a.id} artist={a} />
        ))}
      </CardGrid>
    </div>
  )
}
