import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { fetchLyrics } from "@/lib/services/lyrics"

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/tracks/[trackId]/lyrics">,
) {
  const { trackId } = await ctx.params
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { lyrics: true, syncedLyrics: true },
  })
  return Response.json({
    lyrics: track?.lyrics ?? null,
    synced: track?.syncedLyrics ?? null,
  })
}

// Auto-fetch lyrics from lrclib.net and store them.
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tracks/[trackId]/lyrics">,
) {
  const { trackId } = await ctx.params
  const track = await db.track.findUnique({
    where: { id: trackId },
    include: {
      artist: { select: { name: true } },
      album: { select: { title: true } },
    },
  })
  if (!track) return Response.json({ error: "Not found" }, { status: 404 })

  const result = await fetchLyrics({
    title: track.title,
    artist: track.artist?.name ?? "",
    album: track.album?.title ?? undefined,
    durationSec: track.durationMs ? Math.round(track.durationMs / 1000) : undefined,
  })
  if (!result || (!result.synced && !result.plain)) {
    return Response.json({ error: "No lyrics found" }, { status: 404 })
  }

  await db.track.update({
    where: { id: trackId },
    data: {
      syncedLyrics: result.synced ?? undefined,
      lyrics: result.plain ?? track.lyrics ?? undefined,
    },
  })
  return Response.json({ synced: result.synced, lyrics: result.plain })
}
