import { randomUUID } from "node:crypto"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { deleteCoverIfUnreferenced } from "@/lib/services/library"
import { putObject, s3 } from "@/lib/s3"

// Serves a playlist cover same-origin: the playlist's own coverKey, falling
// back to one of its tracks' cover.
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/playlists/[id]/cover">,
) {
  const { id } = await ctx.params
  const playlist = await db.playlist.findUnique({
    where: { id },
    select: {
      coverKey: true,
      tracks: {
        select: { track: { select: { coverKey: true } } },
        where: { track: { coverKey: { not: null } } },
        take: 1,
        orderBy: { position: "asc" },
      },
    },
  })
  const key = playlist?.coverKey ?? playlist?.tracks[0]?.track.coverKey
  if (!key) return new Response("No cover", { status: 404 })

  const etag = `"${key}"`
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304 })
  }

  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    )
    const body = (
      res.Body as { transformToWebStream: () => ReadableStream }
    ).transformToWebStream()
    return new Response(body, {
      headers: {
        "Content-Type": res.ContentType ?? "image/jpeg",
        "Cache-Control": "private, no-cache",
        ETag: etag,
      },
    })
  } catch {
    return new Response("No cover", { status: 404 })
  }
}

// Replace a playlist's cover with an uploaded image.
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/playlists/[id]/cover">,
) {
  const { id } = await ctx.params
  const form = await req.formData().catch(() => null)
  const file = form?.get("cover")
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return Response.json({ error: "Pick an image file." }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Image is too large (max 10 MB)." }, { status: 413 })
  }

  const playlist = await db.playlist.findUnique({
    where: { id },
    select: { coverKey: true },
  })
  if (!playlist) return Response.json({ error: "Not found" }, { status: 404 })

  const key = `covers/${randomUUID()}.jpg`
  await putObject(key, Buffer.from(await file.arrayBuffer()), "image/jpeg")
  await db.playlist.update({ where: { id }, data: { coverKey: key } })
  await deleteCoverIfUnreferenced(playlist.coverKey)

  return Response.json({ ok: true })
}
