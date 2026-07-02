import { randomUUID } from "node:crypto"
import { env } from "@/lib/env"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { putObject } from "@/lib/s3"
import { createUploadImport } from "@/lib/services/imports"

const ACCEPTED_TYPES = ["audio/", "video/ogg", "application/ogg"]
const ACCEPTED_EXT = [
  ".mp3", ".m4a", ".aac", ".flac", ".wav", ".ogg", ".opus", ".webm", ".aiff",
]
const MAX_BYTES = 100 * 1024 * 1024 // 100 MB

function isAudio(file: File): boolean {
  const type = file.type || ""
  if (ACCEPTED_TYPES.some((p) => type.startsWith(p))) return true
  const lower = file.name.toLowerCase()
  return ACCEPTED_EXT.some((ext) => lower.endsWith(ext))
}

export async function POST(request: Request) {
  const limit = await rateLimit(
    `import:${clientIp(request)}`,
    env.RATE_LIMIT_IMPORT_MAX,
    env.RATE_LIMIT_IMPORT_WINDOW_S,
  )
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const form = await request.formData().catch((err) => {
    console.error("upload: failed to parse form data", err)
    return null
  })
  if (!form) return Response.json({ error: "Invalid form data." }, { status: 400 })

  const files = form.getAll("files").filter((f): f is File => f instanceof File)
  if (files.length === 0) {
    return Response.json({ error: "No files provided." }, { status: 400 })
  }

  // A single problem file must never block the batch: skip what we can't take
  // (too large / not audio) and import the rest. Metadata gaps are fine — the
  // worker leaves missing tags blank for the user to fill in later.
  const created: string[] = []
  const skipped: string[] = []
  for (const file of files) {
    if (file.size > MAX_BYTES || !isAudio(file)) {
      skipped.push(file.name)
      continue
    }
    const type = file.type || "audio/mpeg"

    const key = `uploads/${randomUUID()}/${file.name}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await putObject(key, buffer, type)
    const job = await createUploadImport(file.name, key)
    created.push(job.id)
  }

  if (created.length === 0) {
    return Response.json(
      { error: "None of the files could be uploaded.", skipped },
      { status: 415 },
    )
  }

  return Response.json({ ids: created, skipped }, { status: 202 })
}
