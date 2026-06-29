import "dotenv/config" // load .env before anything reads env (no-op in Docker)
import { Worker } from "bullmq"
import { IMPORT_QUEUE, queueConnection, type ImportJobData } from "@/lib/queue"
import { processImport } from "./process"

console.log("[worker] starting import worker…")

const worker = new Worker<ImportJobData>(
  IMPORT_QUEUE,
  async (job) => {
    console.log(`[worker] processing import ${job.data.importId}`)
    await processImport(job.data.importId)
  },
  {
    connection: queueConnection,
    // yt-dlp + ffmpeg are heavy; keep it modest on a personal box.
    concurrency: 2,
  },
)

worker.on("completed", (job) =>
  console.log(`[worker] done ${job.data.importId}`),
)
worker.on("failed", (job, err) =>
  console.error(`[worker] failed ${job?.data.importId}:`, err.message),
)

async function shutdown() {
  console.log("[worker] shutting down…")
  await worker.close()
  process.exit(0)
}
process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
