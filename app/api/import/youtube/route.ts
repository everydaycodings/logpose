import { z } from "zod"
import { env } from "@/lib/env"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { createYoutubeImport } from "@/lib/services/imports"

const bodySchema = z.object({ url: z.url() })

const YT_HOSTS = ["youtube.com", "www.youtube.com", "youtu.be", "music.youtube.com", "m.youtube.com"]

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

  let host: string
  try {
    host = new URL(parsed.data.url).hostname
  } catch {
    return Response.json({ error: "Enter a valid URL." }, { status: 400 })
  }
  if (!YT_HOSTS.includes(host)) {
    return Response.json(
      { error: "Only YouTube links are supported." },
      { status: 400 },
    )
  }

  const job = await createYoutubeImport(parsed.data.url)
  return Response.json({ id: job.id }, { status: 202 })
}
