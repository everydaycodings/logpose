import { drainOutbox, enqueuePlay } from "@/lib/offline/db"

// Replays play events recorded while offline to the play-count endpoint. Any
// that fail (still offline) are re-queued so nothing is lost.
export async function flushOutbox() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return
  const plays = await drainOutbox()
  for (const p of plays) {
    try {
      const res = await fetch(`/api/tracks/${p.trackId}/play`, { method: "POST" })
      if (!res.ok) await enqueuePlay(p.trackId)
    } catch {
      await enqueuePlay(p.trackId)
    }
  }
}
