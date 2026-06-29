import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"

// Next.js 16 renamed `middleware` to `proxy`. This gates the whole app behind
// the single-password session cookie. Heavy logic (rate limiting, password
// checks) lives in the /api/login route handler, not here.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const valid = await verifySessionToken(token)

  if (!valid) {
    const loginUrl = new URL("/login", request.url)
    // Remember where the user was headed.
    if (request.nextUrl.pathname !== "/") {
      loginUrl.searchParams.set("from", request.nextUrl.pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except the login flow, Next internals, and public assets.
  matcher: [
    "/((?!login|api/login|api/logout|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|logpose).*)",
  ],
}
