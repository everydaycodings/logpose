import { getConnectedUser, lastfmConfigured } from "@/lib/services/lastfm"

// Status: is Last.fm configured (env) and connected (session stored)?
export async function GET() {
  return Response.json({
    configured: lastfmConfigured(),
    user: lastfmConfigured() ? await getConnectedUser() : null,
  })
}
