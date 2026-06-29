import { GetObjectCommand } from "@aws-sdk/client-s3"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { s3 } from "@/lib/s3"

// Proxies cover art same-origin (so the player can sample its colors on a
// canvas without cross-origin tainting), falling back track -> album.
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/cover/[trackId]">,
) {
  const { trackId } = await ctx.params
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { coverKey: true, album: { select: { coverKey: true } } },
  })
  const key = track?.coverKey ?? track?.album?.coverKey
  if (!key) return new Response("No cover", { status: 404 })

  // ETag is the storage key, which changes on every cover update — so the
  // browser revalidates and never serves a stale image after an edit.
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
