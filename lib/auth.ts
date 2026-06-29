import { env } from "./env"

/**
 * Single-password session, no accounts. The cookie holds an expiry timestamp
 * signed with COOKIE_SECRET (HMAC-SHA256 via Web Crypto, so it works in both
 * the Node and Edge runtimes used by `proxy.ts`).
 */
export const SESSION_COOKIE = "jolly_session"
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ""
  for (const b of arr) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.COOKIE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  )
  return toBase64Url(sig)
}

/** Timing-safe string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createSessionToken(): Promise<string> {
  const expiry = String(Date.now() + SESSION_TTL_MS)
  const sig = await hmac(expiry)
  return `${expiry}.${sig}`
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const [expiry, sig] = token.split(".")
  if (!expiry || !sig) return false
  if (Number(expiry) < Date.now()) return false
  const expected = await hmac(expiry)
  return safeEqual(sig, expected)
}

export function checkPassword(input: string): boolean {
  return safeEqual(input, env.APP_PASSWORD)
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
}
