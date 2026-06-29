import { beginAuth, completeAuth, lastfmConfigured } from "@/lib/services/lastfm"

// Step 1: GET -> { url, token } to send the user to Last.fm to authorize.
export async function GET() {
  if (!lastfmConfigured()) {
    return Response.json({ error: "Last.fm is not configured." }, { status: 400 })
  }
  const { token, url } = await beginAuth()
  return Response.json({ token, url })
}

// Step 2: POST { token } after the user authorized -> stores the session.
export async function POST(req: Request) {
  if (!lastfmConfigured()) {
    return Response.json({ error: "Last.fm is not configured." }, { status: 400 })
  }
  const { token } = await req.json().catch(() => ({}))
  if (!token) return Response.json({ error: "Missing token." }, { status: 400 })
  const ok = await completeAuth(token)
  if (!ok) {
    return Response.json(
      { error: "Authorization not completed yet." },
      { status: 400 },
    )
  }
  return Response.json({ ok: true })
}
