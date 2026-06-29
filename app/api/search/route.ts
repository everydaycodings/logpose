import type { NextRequest } from "next/server"
import { searchLibrary } from "@/lib/services/queries"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? ""
  const tracks = await searchLibrary(q)
  return Response.json({ tracks })
}
