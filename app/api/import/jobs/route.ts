import { listRecentJobs } from "@/lib/services/imports"

// Polled by the import screen to show live progress.
export async function GET() {
  const jobs = await listRecentJobs()
  return Response.json({ jobs })
}
