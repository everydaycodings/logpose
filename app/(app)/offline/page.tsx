"use client"

import { CloudSlash } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { TrackList } from "@/components/library/track-list"
import { allTracks } from "@/lib/offline/db"
import { formatBytes } from "@/lib/format"
import type { PlayableTrack } from "@/lib/types"
import { useDownloads } from "@/store/downloads"

const WARN_BYTES = 1024 * 1024 * 1024 // 1 GB

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

export default function OfflinePage() {
  const router = useRouter()
  const [tracks, setTracks] = useState<PlayableTrack[]>([])
  const [bytes, setBytes] = useState(0)
  const [loaded, setLoaded] = useState(false)
  // The page is also reachable from the nav while online; only show the
  // offline banner (and bounce back home on reconnect) when actually offline.
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )
  const wasOffline = useRef(false)
  // Re-read the library whenever a download is added/removed.
  const statusVersion = useDownloads((s) => s.bytesUsed)

  const load = useCallback(async () => {
    const rows = await allTracks()
    rows.sort((a, b) => b.downloadedAt - a.downloadedAt)
    setTracks(rows.map((r) => r.track))
    setBytes(rows.reduce((sum, r) => sum + r.bytes, 0))
    setLoaded(true)
  }, [])

  useEffect(() => {
    void load()
  }, [load, statusVersion])

  // Back to the normal app as soon as the connection returns — but only when
  // the user was forced here by going offline, not when browsing intentionally.
  useEffect(() => {
    if (!online) {
      wasOffline.current = true
    } else if (wasOffline.current) {
      router.replace("/")
    }
  }, [online, router])

  return (
    <div className="mx-auto max-w-3xl">
      {!online && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-4">
          <CloudSlash className="size-6 shrink-0 text-muted-foreground" />
          <div>
            <div className="font-medium">You&apos;re offline</div>
            <div className="text-sm text-muted-foreground">
              Showing your downloaded songs. They&apos;ll sync and the app
              returns to normal when you&apos;re back online.
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between px-1">
        <h1 className="font-heading text-3xl">Downloaded</h1>
        <span className="text-sm text-muted-foreground tabular-nums">
          {tracks.length} {tracks.length === 1 ? "song" : "songs"} ·{" "}
          {formatBytes(bytes)}
        </span>
      </div>

      {bytes > WARN_BYTES && (
        <p className="mb-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Downloads are using {formatBytes(bytes)} of storage. Remove songs you
          no longer need by tapping the check icon.
        </p>
      )}

      <div className="rounded-2xl bg-card/50 p-2">
        {loaded && tracks.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            No downloaded songs yet. While online, tap the download icon on any
            song, album, or playlist to make it available offline.
          </p>
        ) : (
          <TrackList tracks={tracks} showCover />
        )}
      </div>
    </div>
  )
}
