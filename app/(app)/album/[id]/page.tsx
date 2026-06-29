import Link from "next/link"
import { notFound } from "next/navigation"
import { CollectionHeader } from "@/components/library/collection-header"
import { PlayAllButton } from "@/components/library/play-all-button"
import { TrackList } from "@/components/library/track-list"
import { getAlbum } from "@/lib/services/queries"

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const album = await getAlbum(id)
  if (!album) notFound()

  return (
    <div>
      <CollectionHeader
        eyebrow="Album"
        title={album.title}
        coverSrc={`/api/albums/${album.id}/cover`}
        editHref={`/album/${album.id}/edit`}
        subtitle={
          <>
            <Link href={`/artist/${album.artistId}`} className="hover:underline">
              {album.artist}
            </Link>
            {album.year ? ` · ${album.year}` : ""} · {album.tracks.length}{" "}
            {album.tracks.length === 1 ? "song" : "songs"}
          </>
        }
      >
        <PlayAllButton tracks={album.tracks} />
      </CollectionHeader>

      <div className="rounded-2xl bg-card/50 p-2">
        <TrackList tracks={album.tracks} numbered showCover={false} />
      </div>
    </div>
  )
}
