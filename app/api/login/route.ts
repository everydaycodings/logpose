import { cookies } from "next/headers"
import { z } from "zod"
import {
  checkPassword,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth"
import { env } from "@/lib/env"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

const bodySchema = z.object({ password: z.string().min(1).max(200) })

export async function POST(request: Request) {
  const ip = clientIp(request)

  // Brute-force protection: every attempt from an IP counts toward the window.
  const limit = await rateLimit(
    `login:${ip}`,
    env.RATE_LIMIT_LOGIN_MAX,
    env.RATE_LIMIT_LOGIN_WINDOW_S,
  )
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ error: "Enter a password." }, { status: 400 })
  }

  if (!checkPassword(parsed.data.password)) {
    // Generic message — no hint about whether the password format was close.
    return Response.json({ error: "Incorrect password." }, { status: 401 })
  }

  const token = await createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions)

  return Response.json({ ok: true })
}
