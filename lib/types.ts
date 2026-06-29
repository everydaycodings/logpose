/** A track in a shape the client player and lists can use directly. */
export type PlayableTrack = {
  id: string
  title: string
  artist: string | null
  artistId: string | null
  album: string | null
  albumId: string | null
  durationMs: number | null
  hasCover: boolean
  liked: boolean
  playCount?: number
}

export const coverUrl = (trackId: string) => `/api/cover/${trackId}`
export const streamUrl = (trackId: string) => `/api/stream/${trackId}`
