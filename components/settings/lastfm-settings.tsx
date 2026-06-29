"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Status = { configured: boolean; user: string | null }

export function LastfmSettings() {
  const [status, setStatus] = useState<Status | null>(null)
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const res = await fetch("/api/lastfm")
    setStatus(await res.json())
  }
  useEffect(() => {
    refresh()
  }, [])

  async function startConnect() {
    setBusy(true)
    const res = await fetch("/api/lastfm/connect")
    setBusy(false)
    if (!res.ok) {
      toast.error("Could not start Last.fm auth")
      return
    }
    const { url, token } = await res.json()
    setPendingToken(token)
    window.open(url, "_blank", "noopener")
  }

  async function finishConnect() {
    if (!pendingToken) return
    setBusy(true)
    const res = await fetch("/api/lastfm/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: pendingToken }),
    })
    setBusy(false)
    if (res.ok) {
      toast.success("Connected to Last.fm")
      setPendingToken(null)
      refresh()
    } else {
      toast.error("Authorize in the opened tab first, then try again")
    }
  }

  async function disconnect() {
    await fetch("/api/lastfm/disconnect", { method: "POST" })
    toast.success("Disconnected")
    refresh()
  }

  if (!status) return null

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      {!status.configured ? (
        <p className="text-sm text-muted-foreground">
          Scrobbling is off. Add <code>LASTFM_API_KEY</code> and{" "}
          <code>LASTFM_API_SECRET</code> to your environment (create a free API
          account at last.fm/api), then restart to enable.
        </p>
      ) : status.user ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            Connected as <span className="font-medium">{status.user}</span> — your
            plays are scrobbled.
          </div>
          <Button variant="secondary" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Connect your Last.fm account to scrobble what you play.
          </div>
          {pendingToken ? (
            <Button onClick={finishConnect} disabled={busy}>
              I&apos;ve authorized — finish
            </Button>
          ) : (
            <Button onClick={startConnect} disabled={busy}>
              Connect Last.fm
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
