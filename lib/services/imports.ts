import type { ImportStatus, Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { enqueueImport, importQueue } from "@/lib/queue"

export async function createYoutubeImport(url: string) {
  const job = await db.importJob.create({
    data: { type: "YOUTUBE", sourceUrl: url, status: "QUEUED" },
  })
  await enqueueImport(job.id)
  return job
}

export async function createYoutubePlaylistImport(url: string) {
  const job = await db.importJob.create({
    data: { type: "YOUTUBE_PLAYLIST", sourceUrl: url, status: "QUEUED" },
  })
  await enqueueImport(job.id)
  return job
}

export async function createUploadImport(filename: string, uploadKey: string) {
  const job = await db.importJob.create({
    data: { type: "UPLOAD", filename, uploadKey, status: "QUEUED" },
  })
  await enqueueImport(job.id)
  return job
}

export function updateJob(id: string, data: Prisma.ImportJobUpdateInput) {
  return db.importJob.update({ where: { id }, data })
}

export function setJobStatus(
  id: string,
  status: ImportStatus,
  progress?: number,
) {
  return updateJob(id, {
    status,
    ...(progress !== undefined ? { progress } : {}),
  })
}

/**
 * Cancel/remove an import. Drops the still-queued Bull job so the worker never
 * starts it, then deletes the row. If the job is already processing, the row
 * deletion makes `processImport` no-op on its missing-record guard.
 */
export async function deleteJob(id: string) {
  const job = await db.importJob.findUnique({ where: { id } })
  if (!job) return false
  const queued = await importQueue.getJob(id)
  if (queued) await queued.remove().catch(() => {})
  await db.importJob.delete({ where: { id } })
  return true
}

/** Recent jobs for the import screen — active first, then recently finished. */
export function listRecentJobs() {
  return db.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}
