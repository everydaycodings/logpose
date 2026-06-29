import Link from "next/link"
import { Cover } from "@/components/library/cover"

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {children}
    </div>
  )
}

function CardShell({
  href,
  coverTrackId,
  title,
  subtitle,
  round = false,
}: {
  href: string
  coverTrackId: string | null
  title: string
  subtitle: string
  round?: boolean
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-xl p-2 transition-colors hover:bg-card"
    >
      <Cover
        coverTrackId={coverTrackId}
        alt={title}
        rounded={round ? "rounded-full" : "rounded-xl"}
        className="shadow-sm transition-transform group-hover:-translate-y-0.5"
      />
      <div className="min-w-0 px-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </Link>
  )
}

export function AlbumCard({
  album,
}: {
  album: {
    id: string
    title: string
    artist: string
    year: number | null
    trackId: string | null
  }
}) {
  return (
    <CardShell
      href={`/album/${album.id}`}
      coverTrackId={album.trackId}
      title={album.title}
      subtitle={album.year ? `${album.artist} · ${album.year}` : album.artist}
    />
  )
}

export function ArtistCard({
  artist,
}: {
  artist: { id: string; name: string; trackCount: number; trackId: string | null }
}) {
  return (
    <CardShell
      href={`/artist/${artist.id}`}
      coverTrackId={artist.trackId}
      title={artist.name}
      subtitle={`${artist.trackCount} ${artist.trackCount === 1 ? "song" : "songs"}`}
      round
    />
  )
}

export function PlaylistCard({
  playlist,
}: {
  playlist: {
    id: string
    name: string
    trackCount: number
    coverTrackId: string | null
  }
}) {
  return (
    <CardShell
      href={`/playlist/${playlist.id}`}
      coverTrackId={playlist.coverTrackId}
      title={playlist.name}
      subtitle={`${playlist.trackCount} ${playlist.trackCount === 1 ? "song" : "songs"}`}
    />
  )
}
