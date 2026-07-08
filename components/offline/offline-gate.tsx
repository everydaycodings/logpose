"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { pruneExpired, refreshExpiry } from "@/lib/offline/db"
import { flushOutbox } from "@/lib/offline/sync"
import { useDownloads } from "@/store/downloads"

// Watches connectivity from within the app. Offline → jump to the dedicated
// /offline page. On (re)gaining connectivity it refreshes the 30-day expiry
// clock, prunes anything expired, and replays offline plays. Rendered once in
// the authenticated app layout.
export function OfflineGate() {
  const router = useRouter()

  useEffect(() => {
    void useDownloads.getState().hydrate()
    router.prefetch("/offline")

    if (navigator.onLine) {
      void refreshExpiry()
      void pruneExpired()
      void flushOutbox()
    } else {
      router.replace("/offline")
    }

    const onOffline = () => router.replace("/offline")
    const onOnline = () => void flushOutbox()
    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)
    return () => {
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [router])

  return null
}
