import { db } from "@/lib/db"
import type { PlayableTrack } from "@/lib/types"
import { toPlayable } from "./queries"

const DAY = 24 * 60 * 60 * 1000

export async function getListeningStats() {
  const [agg, topArtistRows, topTrackRows, recentEvents] = await Promise.all([
    db.playEvent.aggregate({ _count: true, _sum: { durationMs: true } }),
    db.track.groupBy({
      by: ["artistId"],
      where: { artistId: { not: null }, playCount: { gt: 0 } },
      _sum: { playCount: true },
      orderBy: { _sum: { playCount: "desc" } },
      take: 8,
    }),
    db.track.findMany({
      where: { playCount: { gt: 0 } },
      include: {
        artist: { select: { id: true, name: true } },
        album: { select: { id: true, title: true, coverKey: true } },
      },
      orderBy: { playCount: "desc" },
      take: 8,
    }),
    // Last 30 days of events for the activity chart + streak.
    db.playEvent.findMany({
      where: { playedAt: { gte: new Date(Date.now() - 60 * DAY) } },
      select: { playedAt: true },
      orderBy: { playedAt: "desc" },
    }),
  ])

  // Resolve top artists' names.
  const artistIds = topArtistRows.map((r) => r.artistId!).filter(Boolean)
  const artists = await db.artist.findMany({
    where: { id: { in: artistIds } },
    include: { tracks: { select: { id: true }, take: 1 } },
  })
  const artistMap = new Map(artists.map((a) => [a.id, a]))
  const topArtists = topArtistRows
    .map((r) => {
      const a = artistMap.get(r.artistId!)
      if (!a) return null
      return {
        id: a.id,
        name: a.name,
        plays: r._sum.playCount ?? 0,
        trackId: a.tracks[0]?.id ?? null,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // Activity: plays per day over the last 30 days.
  const buckets = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * DAY)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }
  for (const e of recentEvents) {
    const key = e.playedAt.toISOString().slice(0, 10)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  const activity = [...buckets.entries()]
    .map(([date, count]) => ({ date, count }))
    .reverse()

  // Current streak: consecutive days (ending today/yesterday) with a play.
  const playedDays = new Set(activity.filter((a) => a.count > 0).map((a) => a.date))
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const key = new Date(Date.now() - i * DAY).toISOString().slice(0, 10)
    if (playedDays.has(key)) streak++
    else if (i > 0) break // allow today to be empty without breaking
  }

  return {
    totalPlays: agg._count,
    totalListeningMs: agg._sum.durationMs ?? 0,
    topArtists,
    topTracks: topTrackRows.map(toPlayable),
    activity,
    streak,
  }
}

/** Tracks played on this calendar day in previous years. */
export async function getOnThisDay(): Promise<PlayableTrack[]> {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const rows = await db.$queryRaw<{ trackId: string }[]>`
    SELECT DISTINCT "trackId" FROM "PlayEvent"
    WHERE EXTRACT(MONTH FROM "playedAt") = ${month}
      AND EXTRACT(DAY FROM "playedAt") = ${day}
      AND EXTRACT(YEAR FROM "playedAt") < ${now.getFullYear()}
    LIMIT 20
  `
  if (rows.length === 0) return []
  const tracks = await db.track.findMany({
    where: { id: { in: rows.map((r) => r.trackId) } },
    include: {
      artist: { select: { id: true, name: true } },
      album: { select: { id: true, title: true, coverKey: true } },
    },
  })
  return tracks.map(toPlayable)
}
