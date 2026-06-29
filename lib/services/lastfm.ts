import { createHash } from "node:crypto"
import { db } from "@/lib/db"
import { env } from "@/lib/env"

/**
 * Last.fm scrobbling. Entirely optional and dormant unless both
 * LASTFM_API_KEY and LASTFM_API_SECRET are set AND the user has connected
 * their account (a session key stored in Settings).
 *
 * Auth uses Last.fm's desktop flow: getToken -> user authorizes in browser ->
 * getSession (exchanges the token for a long-lived session key).
 */

const API = "https://ws.audioscrobbler.com/2.0/"
const SESSION_KEY = "lastfm_session"
const USER_KEY = "lastfm_user"

export function lastfmConfigured(): boolean {
  return Boolean(env.LASTFM_API_KEY && env.LASTFM_API_SECRET)
}

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("")
  return createHash("md5")
    .update(sorted + env.LASTFM_API_SECRET, "utf8")
    .digest("hex")
}

async function call(
  params: Record<string, string>,
  method: "GET" | "POST" = "GET",
) {
  const signed = { ...params, api_sig: sign(params) }
  const body = new URLSearchParams({ ...signed, format: "json" })
  const res = await fetch(method === "GET" ? `${API}?${body}` : API, {
    method,
    ...(method === "POST"
      ? { body, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      : {}),
  })
  return res.json()
}

export async function getConnectedUser(): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key: USER_KEY } })
  return row?.value ?? null
}

async function getSessionKey(): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key: SESSION_KEY } })
  return row?.value ?? null
}

/** Step 1 of connect: get a request token + the authorize URL. */
export async function beginAuth(): Promise<{ token: string; url: string }> {
  const data = await call({
    method: "auth.getToken",
    api_key: env.LASTFM_API_KEY!,
  })
  const token = data.token as string
  return {
    token,
    url: `https://www.last.fm/api/auth/?api_key=${env.LASTFM_API_KEY}&token=${token}`,
  }
}

/** Step 2: exchange the authorized token for a session key and store it. */
export async function completeAuth(token: string): Promise<boolean> {
  const data = await call({
    method: "auth.getSession",
    api_key: env.LASTFM_API_KEY!,
    token,
  })
  const session = data?.session
  if (!session?.key) return false
  await db.setting.upsert({
    where: { key: SESSION_KEY },
    update: { value: session.key },
    create: { key: SESSION_KEY, value: session.key },
  })
  await db.setting.upsert({
    where: { key: USER_KEY },
    update: { value: session.name },
    create: { key: USER_KEY, value: session.name },
  })
  return true
}

export async function disconnect() {
  await db.setting
    .deleteMany({ where: { key: { in: [SESSION_KEY, USER_KEY] } } })
    .catch(() => {})
}

export async function scrobble(track: {
  title: string
  artist: string
  album?: string
  durationMs?: number
}): Promise<void> {
  if (!lastfmConfigured() || !track.artist) return
  const sk = await getSessionKey()
  if (!sk) return

  const params: Record<string, string> = {
    method: "track.scrobble",
    api_key: env.LASTFM_API_KEY!,
    sk,
    "artist[0]": track.artist,
    "track[0]": track.title,
    "timestamp[0]": String(Math.floor(Date.now() / 1000)),
  }
  if (track.album) params["album[0]"] = track.album
  if (track.durationMs) params["duration[0]"] = String(Math.round(track.durationMs / 1000))
  await call(params, "POST").catch(() => {})
}
