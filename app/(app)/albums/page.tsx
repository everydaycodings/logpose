import type { Metadata } from "next"
import { AlbumCard, CardGrid } from "@/components/library/media-cards"
import { EmptyState } from "@/components/library/empty-state"
import { getAlbums } from "@/lib/services/queries"

export const metadata: Metadata = { title: "Albums" }

export default async function AlbumsPage() {
  const albums = await getAlbums()

  if (albums.length === 0) {
    return (
      <EmptyState
        title="No albums yet"
        message="Import some music and its albums will line the shelves here."
        actionLabel="Add music"
        actionHref="/import"
      />
    )
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-5xl">Albums</h1>
      <CardGrid>
        {albums.map((a) => (
          <AlbumCard key={a.id} album={a} />
        ))}
      </CardGrid>
    </div>
  )
}
