import { Redis } from "ioredis"
import { env } from "./env"

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

/**
 * Shared Redis connection for rate limiting and pub/sub-style reads.
 * BullMQ creates its own connections (see lib/queue.ts) because it requires
 * `maxRetriesPerRequest: null`.
 */
export const redis =
  globalForRedis.redis ?? new Redis(env.REDIS_URL, { lazyConnect: false })

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis
