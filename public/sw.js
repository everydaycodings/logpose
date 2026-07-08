// LogPose service worker. Caches the app shell + static assets, and — for
// downloaded tracks — serves audio, covers and lyrics from IndexedDB so the app
// plays fully offline. IndexedDB is written by the app (lib/offline/db.ts); the
// DB name / version / store shape below MUST stay in sync with that file.
const CACHE = "logpose-v2"
const OFFLINE_URL = "/offline"

const IDB_NAME = "logpose-offline"
const IDB_VERSION = 1

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // Precache the offline shell so a cold start with no network has a page.
      try {
        await cache.add(OFFLINE_URL)
      } catch {
        /* logged out or offline during install — fine */
      }
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Downloaded media/lyrics: serve from IndexedDB when present.
  const stream = url.pathname.match(/^\/api\/stream\/([^/]+)$/)
  if (stream) {
    event.respondWith(serveAudio(stream[1], request))
    return
  }
  const cover = url.pathname.match(/^\/api\/cover\/([^/]+)$/)
  if (cover) {
    event.respondWith(serveCover(cover[1], request))
    return
  }
  const lyrics = url.pathname.match(/^\/api\/tracks\/([^/]+)\/lyrics$/)
  if (lyrics) {
    event.respondWith(serveLyrics(lyrics[1], request))
    return
  }

  // All other API traffic (mutations, search, play counts) is never cached.
  if (url.pathname.startsWith("/api/")) return

  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons")
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(navigateOrOffline(request))
  }
})

// --- app shell caching ---

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone())
  return res
}

async function navigateOrOffline(request) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch {
    // Serve the offline shell for its own URL; for any other page, redirect to
    // it so the address bar matches the document that hydrates.
    const url = new URL(request.url)
    if (url.pathname === OFFLINE_URL) {
      return (await cache.match(OFFLINE_URL)) ?? (await cache.match("/"))
    }
    return Response.redirect(OFFLINE_URL, 302)
  }
}

// --- offline media served from IndexedDB ---

async function serveAudio(id, request) {
  const record = await idbGetTrack(id)
  if (!record || !record.audio) return passthrough(request)

  const blob = record.audio
  const total = blob.size
  const type = blob.type || "audio/mpeg"
  const range = request.headers.get("range")

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range)
    const start = m && m[1] ? parseInt(m[1], 10) : 0
    const end = m && m[2] ? parseInt(m[2], 10) : total - 1
    const body = blob.slice(start, end + 1)
    return new Response(body, {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
      },
    })
  }

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
    },
  })
}

async function serveCover(id, request) {
  const record = await idbGetTrack(id)
  if (!record || !record.cover) return passthrough(request)
  return new Response(record.cover, {
    status: 200,
    headers: { "Content-Type": record.cover.type || "image/jpeg" },
  })
}

async function serveLyrics(id, request) {
  const record = await idbGetTrack(id)
  if (!record) return passthrough(request)
  return Response.json({
    lyrics: record.lyrics ?? null,
    synced: record.syncedLyrics ?? null,
  })
}

// Track isn't downloaded: try the network, fail cleanly when offline.
async function passthrough(request) {
  try {
    return await fetch(request)
  } catch {
    return new Response("Offline", { status: 503 })
  }
}

// --- minimal raw IndexedDB reader (no bundler in the SW) ---

let idbPromise = null
function idbOpen() {
  if (!idbPromise) {
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION)
      // Mirror lib/offline/db.ts so whichever context opens first creates the
      // same stores.
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains("tracks"))
          db.createObjectStore("tracks", { keyPath: "id" })
        if (!db.objectStoreNames.contains("outbox"))
          db.createObjectStore("outbox", { autoIncrement: true })
        if (!db.objectStoreNames.contains("pending"))
          db.createObjectStore("pending", { keyPath: "id" })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return idbPromise
}

async function idbGetTrack(id) {
  try {
    const db = await idbOpen()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("tracks", "readonly")
      const req = tx.objectStore("tracks").get(id)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}
