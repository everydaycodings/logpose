import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { scrobble } from "@/lib/services/lastfm"

// Called by the player when a track actually starts playing.
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tracks/[trackId]/play">,
) {
  const { trackId } = await ctx.params
  const track = await db.track.findUnique({
    where: { id: trackId },
    include: { artist: { select: { name: true } }, album: { select: { title: true } } },
  })
  if (!track) return Response.json({ ok: false }, { status: 404 })

  await db.$transaction([
    db.track.update({
      where: { id: trackId },
      data: { playCount: { increment: 1 }, lastPlayedAt: new Date() },
    }),
    db.playEvent.create({
      data: { trackId, durationMs: track.durationMs },
    }),
  ])

  // Fire-and-forget Last.fm scrobble (no-op unless configured + connected).
  void scrobble({
    title: track.title,
    artist: track.artist?.name ?? "",
    album: track.album?.title ?? undefined,
    durationMs: track.durationMs ?? undefined,
  })

  return Response.json({ ok: true })
}
