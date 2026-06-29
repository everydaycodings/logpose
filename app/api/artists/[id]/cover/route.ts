import { randomUUID } from "node:crypto"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { deleteCoverIfUnreferenced } from "@/lib/services/library"
import { putObject, s3 } from "@/lib/s3"

// Serves an artist photo same-origin: the artist's own coverKey, falling back
// to one of its tracks' cover so cards/headers always show something.
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/artists/[id]/cover">,
) {
  const { id } = await ctx.params
  const artist = await db.artist.findUnique({
    where: { id },
    select: {
      coverKey: true,
      tracks: {
        select: { coverKey: true, album: { select: { coverKey: true } } },
        where: { coverKey: { not: null } },
        take: 1,
      },
    },
  })
  const key =
    artist?.coverKey ??
    artist?.tracks[0]?.coverKey ??
    artist?.tracks[0]?.album?.coverKey
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

// Replace an artist's photo with an uploaded image.
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/artists/[id]/cover">,
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

  const artist = await db.artist.findUnique({
    where: { id },
    select: { coverKey: true },
  })
  if (!artist) return Response.json({ error: "Not found" }, { status: 404 })

  const key = `covers/${randomUUID()}.jpg`
  await putObject(key, Buffer.from(await file.arrayBuffer()), "image/jpeg")
  await db.artist.update({ where: { id }, data: { coverKey: key } })
  await deleteCoverIfUnreferenced(artist.coverKey)

  return Response.json({ ok: true })
}
