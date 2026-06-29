import { disconnect } from "@/lib/services/lastfm"

export async function POST() {
  await disconnect()
  return Response.json({ ok: true })
}
