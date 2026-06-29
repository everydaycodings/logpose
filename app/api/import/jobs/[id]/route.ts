import { deleteJob } from "@/lib/services/imports"

// Cancel/remove an in-progress or queued import from the Recent imports list.
export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/import/jobs/[id]">,
) {
  const { id } = await ctx.params
  const ok = await deleteJob(id)
  if (!ok) return new Response("Not found", { status: 404 })
  return new Response(null, { status: 204 })
}
