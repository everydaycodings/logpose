import { env } from "@/lib/env"

/**
 * Fetch lyrics from lrclib.net — free, keyless, returns both synced (LRC) and
 * plain lyrics. Best-effort: returns null on any miss.
 */
export async function fetchLyrics(params: {
  title: string
  artist: string
  album?: string
  durationSec?: number
}): Promise<{ synced: string | null; plain: string | null } | null> {
  if (!params.artist || !params.title) return null
  const q = new URLSearchParams({
    track_name: params.title,
    artist_name: params.artist,
  })
  if (params.album) q.set("album_name", params.album)
  if (params.durationSec) q.set("duration", String(params.durationSec))

  try {
    const res = await fetch(`https://lrclib.net/api/get?${q}`, {
      headers: { "User-Agent": env.MUSICBRAINZ_USER_AGENT },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      syncedLyrics?: string | null
      plainLyrics?: string | null
    }
    return {
      synced: data.syncedLyrics || null,
      plain: data.plainLyrics || null,
    }
  } catch {
    return null
  }
}

export type { LrcLine } from "@/lib/lrc"
export { parseLrc } from "@/lib/lrc"
