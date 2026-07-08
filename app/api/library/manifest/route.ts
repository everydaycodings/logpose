import { getAllTracks } from "@/lib/services/queries"

// Full library as lightweight PlayableTrack metadata — used by the "download
// entire library" action to enumerate every track.
export async function GET() {
  const tracks = await getAllTracks()
  return Response.json({ tracks })
}
