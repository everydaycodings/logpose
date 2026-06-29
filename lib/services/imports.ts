import type { ImportStatus, Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { enqueueImport } from "@/lib/queue"

export async function createYoutubeImport(url: string) {
  const job = await db.importJob.create({
    data: { type: "YOUTUBE", sourceUrl: url, status: "QUEUED" },
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

/** Recent jobs for the import screen — active first, then recently finished. */
export function listRecentJobs() {
  return db.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}
