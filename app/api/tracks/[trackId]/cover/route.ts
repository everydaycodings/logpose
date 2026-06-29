import { randomUUID } from "node:crypto"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { deleteCoverIfUnreferenced } from "@/lib/services/library"
import { putObject } from "@/lib/s3"

// Replace a track's cover with an uploaded image.
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/tracks/[trackId]/cover">,
) {
  const { trackId } = await ctx.params
  const form = await req.formData().catch(() => null)
  const file = form?.get("cover")
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return Response.json({ error: "Pick an image file." }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Image is too large (max 10 MB)." }, { status: 413 })
  }

  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { coverKey: true },
  })
  if (!track) return Response.json({ error: "Not found" }, { status: 404 })

  const key = `covers/${randomUUID()}.jpg`
  await putObject(key, Buffer.from(await file.arrayBuffer()), "image/jpeg")
  await db.track.update({ where: { id: trackId }, data: { coverKey: key } })
  await deleteCoverIfUnreferenced(track.coverKey)

  return Response.json({ ok: true })
}
