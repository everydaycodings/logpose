import { GetObjectCommand } from "@aws-sdk/client-s3"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { s3 } from "@/lib/s3"

// Proxies audio bytes from MinIO same-origin (required for the Web Audio graph
// used by crossfade + the visualizer). Forwards Range requests so the browser
// can seek natively.
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/stream/[trackId]">,
) {
  const { trackId } = await ctx.params
  const track = await db.track.findUnique({
    where: { id: trackId },
    select: { mp3Key: true },
  })
  if (!track?.mp3Key) return new Response("Not found", { status: 404 })

  const range = req.headers.get("range") ?? undefined
  try {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: track.mp3Key,
        Range: range,
      }),
    )

    const headers = new Headers({
      "Content-Type": res.ContentType ?? "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    })
    if (res.ContentLength != null)
      headers.set("Content-Length", String(res.ContentLength))
    if (res.ContentRange) headers.set("Content-Range", res.ContentRange)

    const body = (
      res.Body as { transformToWebStream: () => ReadableStream }
    ).transformToWebStream()

    return new Response(body, {
      status: range && res.ContentRange ? 206 : 200,
      headers,
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
