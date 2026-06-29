import { Queue } from "bullmq"
import { Redis } from "ioredis"
import { env } from "./env"

export const IMPORT_QUEUE = "imports"

export type ImportJobData = {
  importId: string
}

// BullMQ requires its own connection with retries disabled.
export const queueConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

const globalForQueue = globalThis as unknown as {
  importQueue: Queue<ImportJobData> | undefined
}

export const importQueue =
  globalForQueue.importQueue ??
  new Queue<ImportJobData>(IMPORT_QUEUE, { connection: queueConnection })

if (process.env.NODE_ENV !== "production")
  globalForQueue.importQueue = importQueue

export function enqueueImport(importId: string) {
  return importQueue.add(
    "import",
    { importId },
    {
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  )
}
