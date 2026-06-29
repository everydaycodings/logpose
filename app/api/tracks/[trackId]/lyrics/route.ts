import type { NextRequest } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/tracks/[trackId]/lyrics">,
) {
  const { trackId } = await ctx.params
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { lyrics: true },
  })
  return Response.json({ lyrics: track?.lyrics ?? null })
}
