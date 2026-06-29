import { revalidatePath } from "next/cache"
import { restoreBackup } from "@/lib/services/restore"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get("backup")
  if (!(file instanceof File)) {
    return Response.json({ error: "No backup file provided." }, { status: 400 })
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const summary = await restoreBackup(buffer)
    revalidatePath("/")
    return Response.json({ ok: true, summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Restore failed"
    return Response.json({ error: message }, { status: 400 })
  }
}
