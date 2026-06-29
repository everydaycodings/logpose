import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { presignGet } from "@/lib/s3"

// Redirects to a presigned cover image, falling back through track -> album.
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/cover/[trackId]">,
) {
  const { trackId } = await ctx.params
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { coverKey: true, album: { select: { coverKey: true } } },
  })
  const key = track?.coverKey ?? track?.album?.coverKey
  if (!key) return new Response("No cover", { status: 404 })
  redirect(await presignGet(key))
}
