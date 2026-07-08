"use client"

import { CircleNotch, DownloadSimple } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/format"
import { useDownloads } from "@/store/downloads"

// Settings control: download the whole library for offline use, with a live
// count of what's already stored.
export function DownloadLibrary() {
  const status = useDownloads((s) => s.status)
  const bytesUsed = useDownloads((s) => s.bytesUsed)
  const downloadAll = useDownloads((s) => s.downloadAll)
  const hydrate = useDownloads((s) => s.hydrate)

  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const downloadedCount = Object.values(status).filter((s) => s === "done").length

  async function onClick() {
    setBusy(true)
    try {
      await downloadAll()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card/50 p-5 sm:flex-row sm:items-center">
      <div>
        <div className="font-medium">Download entire library</div>
        <div className="text-sm text-muted-foreground">
          Save every song for offline playback. {downloadedCount} downloaded ·{" "}
          {formatBytes(bytesUsed)} used.
        </div>
      </div>
      <Button onClick={onClick} disabled={busy} className="gap-2">
        {busy ? (
          <CircleNotch className="size-4 animate-spin" />
        ) : (
          <DownloadSimple className="size-4" />
        )}
        {busy ? "Downloading…" : "Download all"}
      </Button>
    </div>
  )
}
