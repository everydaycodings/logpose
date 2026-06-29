import { db } from "@/lib/db"

// Lightweight list for the "add to playlist" menu.
export async function GET() {
  const playlists = await db.playlist.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  })
  return Response.json({ playlists })
}
