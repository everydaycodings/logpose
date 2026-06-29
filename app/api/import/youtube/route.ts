import { z } from "zod"
import { env } from "@/lib/env"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import {
  createYoutubeImport,
  createYoutubePlaylistImport,
} from "@/lib/services/imports"

// Accepts a single { url } or { urls: string[] } (batch). Playlist URLs are
// expanded by the worker into per-video jobs.
const bodySchema = z.object({
  url: z.string().optional(),
  urls: z.array(z.string()).optional(),
})

const YT_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "music.youtube.com",
  "m.youtube.com",
]

function classify(raw: string): "video" | "playlist" | null {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  if (!YT_HOSTS.includes(u.hostname)) return null
  // A bare playlist (list= but no v=) or /playlist path.
  if (u.pathname.startsWith("/playlist")) return "playlist"
  if (u.searchParams.has("list") && !u.searchParams.has("v")) return "playlist"
  return "video"
}

export async function POST(request: Request) {
  const limit = await rateLimit(
    `import:${clientIp(request)}`,
    env.RATE_LIMIT_IMPORT_MAX,
    env.RATE_LIMIT_IMPORT_WINDOW_S,
  )
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid URL." }, { status: 400 })
  }

  const raw = [
    ...(parsed.data.urls ?? []),
    ...(parsed.data.url ? [parsed.data.url] : []),
  ]
    .flatMap((s) => s.split(/[\n,]/))
    .map((s) => s.trim())
    .filter(Boolean)

  if (raw.length === 0) {
    return Response.json({ error: "Enter at least one URL." }, { status: 400 })
  }

  let queued = 0
  for (const url of raw) {
    const kind = classify(url)
    if (kind === "playlist") {
      await createYoutubePlaylistImport(url)
      queued++
    } else if (kind === "video") {
      await createYoutubeImport(url)
      queued++
    }
  }

  if (queued === 0) {
    return Response.json(
      { error: "No valid YouTube links found." },
      { status: 400 },
    )
  }
  return Response.json({ queued }, { status: 202 })
}
