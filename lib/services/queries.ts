import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import type { PlayableTrack } from "@/lib/types"

const trackInclude = {
  artist: { select: { id: true, name: true } },
  album: { select: { id: true, title: true, coverKey: true } },
} satisfies Prisma.TrackInclude

type TrackWithRels = Prisma.TrackGetPayload<{ include: typeof trackInclude }>

export function toPlayable(t: TrackWithRels): PlayableTrack {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist?.name ?? null,
    artistId: t.artistId,
    album: t.album?.title ?? null,
    albumId: t.albumId,
    durationMs: t.durationMs,
    hasCover: Boolean(t.coverKey || t.album?.coverKey),
    liked: t.liked,
    playCount: t.playCount,
    gainDb: t.gainDb,
  }
}

export async function getRecentTracks(limit = 18): Promise<PlayableTrack[]> {
  const rows = await db.track.findMany({
    include: trackInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return rows.map(toPlayable)
}

export async function getAllTracks(): Promise<PlayableTrack[]> {
  const rows = await db.track.findMany({
    include: trackInclude,
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toPlayable)
}

/** A short A–Z preview of the library for the dashboard's Songs section. */
export async function getSongsPreview(limit = 7): Promise<PlayableTrack[]> {
  const rows = await db.track.findMany({
    include: trackInclude,
    orderBy: { title: "asc" },
    take: limit,
  })
  return rows.map(toPlayable)
}

export async function getMostPlayed(limit = 6): Promise<PlayableTrack[]> {
  const rows = await db.track.findMany({
    where: { playCount: { gt: 0 } },
    include: trackInclude,
    orderBy: [{ playCount: "desc" }, { lastPlayedAt: "desc" }],
    take: limit,
  })
  return rows.map(toPlayable)
}

export async function getLeastPlayed(limit = 6): Promise<PlayableTrack[]> {
  const rows = await db.track.findMany({
    include: trackInclude,
    orderBy: [{ playCount: "asc" }, { createdAt: "asc" }],
    take: limit,
  })
  return rows.map(toPlayable)
}

export async function getRecentlyPlayed(limit = 6): Promise<PlayableTrack[]> {
  const rows = await db.track.findMany({
    where: { lastPlayedAt: { not: null } },
    include: trackInclude,
    orderBy: { lastPlayedAt: "desc" },
    take: limit,
  })
  return rows.map(toPlayable)
}

export async function getLikedTracks(): Promise<PlayableTrack[]> {
  const rows = await db.track.findMany({
    where: { liked: true },
    include: trackInclude,
    orderBy: { lastPlayedAt: "desc" },
  })
  return rows.map(toPlayable)
}

export type AlbumSummary = {
  id: string
  title: string
  artist: string
  year: number | null
  hasCover: boolean
  trackId: string | null // a track to source the cover from
}

export async function getAlbums(): Promise<AlbumSummary[]> {
  const albums = await db.album.findMany({
    include: {
      artist: { select: { name: true } },
      tracks: { select: { id: true, coverKey: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  })
  return albums.map((a) => ({
    id: a.id,
    title: a.title,
    artist: a.artist.name,
    year: a.year,
    hasCover: Boolean(a.coverKey || a.tracks[0]?.coverKey),
    trackId: a.tracks[0]?.id ?? null,
  }))
}

export async function getAlbum(id: string) {
  const album = await db.album.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true } },
      tracks: { include: trackInclude, orderBy: { trackNumber: "asc" } },
    },
  })
  if (!album) return null
  return {
    id: album.id,
    title: album.title,
    artist: album.artist.name,
    artistId: album.artistId,
    year: album.year,
    tracks: album.tracks.map(toPlayable),
  }
}

export async function getArtists() {
  const artists = await db.artist.findMany({
    include: {
      tracks: { select: { id: true, coverKey: true }, take: 1 },
      _count: { select: { tracks: true } },
    },
    orderBy: { name: "asc" },
  })
  return artists.map((a) => ({
    id: a.id,
    name: a.name,
    trackCount: a._count.tracks,
    hasCover: Boolean(a.coverKey || a.tracks[0]?.coverKey),
    trackId: a.tracks[0]?.id ?? null,
  }))
}

export async function getArtist(id: string) {
  const artist = await db.artist.findUnique({
    where: { id },
    include: {
      tracks: { include: trackInclude, orderBy: { createdAt: "desc" } },
      albums: {
        include: { tracks: { select: { id: true }, take: 1 } },
        orderBy: { year: "desc" },
      },
    },
  })
  if (!artist) return null
  return {
    id: artist.id,
    name: artist.name,
    tracks: artist.tracks.map(toPlayable),
    albums: artist.albums.map((al) => ({
      id: al.id,
      title: al.title,
      year: al.year,
      trackId: al.tracks[0]?.id ?? null,
    })),
  }
}

export async function getPlaylists() {
  const playlists = await db.playlist.findMany({
    include: {
      tracks: {
        take: 1,
        orderBy: { position: "asc" },
        include: { track: { select: { id: true, coverKey: true } } },
      },
      _count: { select: { tracks: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return playlists.map((p) => ({
    id: p.id,
    name: p.name,
    trackCount: p._count.tracks,
    coverTrackId: p.tracks[0]?.track.id ?? null,
  }))
}

export async function getPlaylist(id: string) {
  const playlist = await db.playlist.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { position: "asc" },
        include: { track: { include: trackInclude } },
      },
    },
  })
  if (!playlist) return null
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    tracks: playlist.tracks.map((pt) => toPlayable(pt.track)),
  }
}

export async function getTrackEditData(id: string) {
  const t = await db.track.findUnique({
    where: { id },
    include: {
      artist: { select: { name: true } },
      album: { select: { title: true } },
    },
  })
  if (!t) return null
  return {
    id: t.id,
    title: t.title,
    artist: t.artist?.name ?? "",
    album: t.album?.title ?? "",
    year: t.year ?? undefined,
    genre: t.genre ?? "",
    trackNumber: t.trackNumber ?? undefined,
    discNumber: t.discNumber ?? undefined,
    lyrics: t.lyrics ?? "",
    hasCover: Boolean(t.coverKey),
  }
}

/** Distinct artist names + album titles, for edit-form autocomplete pickers. */
export async function getEditPickers() {
  const [artists, albums] = await Promise.all([
    db.artist.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    db.album.findMany({ select: { title: true }, orderBy: { title: "asc" } }),
  ])
  return {
    artistNames: [...new Set(artists.map((a) => a.name))],
    albumTitles: [...new Set(albums.map((a) => a.title))],
  }
}

export async function getArtistEditData(id: string) {
  const artist = await db.artist.findUnique({
    where: { id },
    select: { id: true, name: true, coverKey: true },
  })
  if (!artist) return null
  return { id: artist.id, name: artist.name, hasCover: Boolean(artist.coverKey) }
}

export async function getAlbumEditData(id: string) {
  const album = await db.album.findUnique({
    where: { id },
    select: { id: true, title: true, year: true, coverKey: true },
  })
  if (!album) return null
  return {
    id: album.id,
    title: album.title,
    year: album.year ?? undefined,
    hasCover: Boolean(album.coverKey),
  }
}

export async function searchLibrary(q: string): Promise<PlayableTrack[]> {
  const query = q.trim()
  if (!query) return []
  const rows = await db.track.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { artist: { name: { contains: query, mode: "insensitive" } } },
        { album: { title: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: trackInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return rows.map(toPlayable)
}
