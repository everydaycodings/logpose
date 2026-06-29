import { redis } from "./redis"

export type RateLimitResult = {
  ok: boolean
  remaining: number
  /** Seconds until the window resets (only meaningful when `ok` is false). */
  retryAfter: number
}

/**
 * Fixed-window rate limiter backed by Redis. Simple, atomic, and good enough
 * for a personal app — the first request in a window sets the TTL.
 *
 * @param key     unique bucket (e.g. `login:1.2.3.4`)
 * @param max     allowed requests per window
 * @param windowS window length in seconds
 */
export async function rateLimit(
  key: string,
  max: number,
  windowS: number,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`
  const count = await redis.incr(redisKey)
  if (count === 1) {
    await redis.expire(redisKey, windowS)
  }
  const ttl = await redis.ttl(redisKey)
  const retryAfter = ttl > 0 ? ttl : windowS

  if (count > max) {
    return { ok: false, remaining: 0, retryAfter }
  }
  return { ok: true, remaining: Math.max(0, max - count), retryAfter }
}

/** Best-effort client IP from proxy headers, falling back to a constant. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export function tooManyRequests(retryAfter: number) {
  return Response.json(
    { error: "Too many requests. Slow down and try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  )
}
