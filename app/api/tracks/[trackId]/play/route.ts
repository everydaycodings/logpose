import type { NextRequest } from "next/server"
import { db } from "@/lib/db"

// Called by the player when a track actually starts playing.
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tracks/[trackId]/play">,
) {
  const { trackId } = await ctx.params
  await db.track
    .update({
      where: { id: trackId },
      data: { playCount: { increment: 1 }, lastPlayedAt: new Date() },
    })
    .catch(() => null)
  return Response.json({ ok: true })
}
