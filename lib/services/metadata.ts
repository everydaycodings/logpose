import { env } from "@/lib/env"

/**
 * Best-effort metadata enrichment via MusicBrainz + Cover Art Archive.
 * Both are free and keyless but require a descriptive User-Agent and ask for
 * no more than ~1 request/second. Everything here degrades gracefully — a
 * failed lookup just means we keep whatever we already had.
 */

export type EnrichedMetadata = {
  title?: string
  artist?: string
  album?: string
  year?: number
  mbid?: string
  releaseMbid?: string
}

const MB_BASE = "https://musicbrainz.org/ws/2"
const CAA_BASE = "https://coverartarchive.org"

let lastCall = 0
async function throttle() {
  const now = Date.now()
  const wait = Math.max(0, 1100 - (now - lastCall))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCall = Date.now()
}

async function mbFetch(path: string): Promise<unknown | null> {
  await throttle()
  try {
    const res = await fetch(`${MB_BASE}${path}`, {
      headers: {
        "User-Agent": env.MUSICBRAINZ_USER_AGENT,
        Accept: "application/json",
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

type MbRecording = {
  id: string
  title: string
  "artist-credit"?: { name: string }[]
  releases?: { id: string; title: string; date?: string }[]
}

/** Look up a recording by title (+ optional artist hint). */
export async function lookupRecording(
  title: string,
  artist?: string,
): Promise<EnrichedMetadata | null> {
  const query = artist
    ? `recording:"${title}" AND artist:"${artist}"`
    : `recording:"${title}"`
  const data = (await mbFetch(
    `/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=1`,
  )) as { recordings?: MbRecording[] } | null

  const rec = data?.recordings?.[0]
  if (!rec) return null

  const release = rec.releases?.[0]
  const year = release?.date
    ? Number(release.date.slice(0, 4)) || undefined
    : undefined

  return {
    title: rec.title,
    artist: rec["artist-credit"]?.[0]?.name,
    album: release?.title,
    year,
    mbid: rec.id,
    releaseMbid: release?.id,
  }
}

/** Fetch front cover art for a release (250px thumbnail) as a Buffer. */
export async function fetchCoverArt(
  releaseMbid: string,
): Promise<Buffer | null> {
  try {
    const res = await fetch(`${CAA_BASE}/release/${releaseMbid}/front-500`, {
      headers: { "User-Agent": env.MUSICBRAINZ_USER_AGENT },
      redirect: "follow",
    })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
