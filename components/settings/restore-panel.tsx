"use client"

import { ArrowCounterClockwise } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { confirm } from "@/lib/dialog"

export function RestorePanel() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function restore(file: File) {
    const ok = await confirm({
      title: "Restore from backup?",
      description:
        "Songs and files from the backup will be added. Existing items with the same id are updated.",
      confirmLabel: "Restore",
    })
    if (!ok) return
    setBusy(true)
    const fd = new FormData()
    fd.append("backup", file)
    const res = await fetch("/api/import/backup", { method: "POST", body: fd })
    setBusy(false)
    if (res.ok) {
      const { summary } = await res.json()
      toast.success(
        `Restored ${summary.tracks} songs, ${summary.assets} files.`,
      )
      router.refresh()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? "Restore failed")
    }
  }

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card/50 p-5 sm:flex-row sm:items-center">
      <div>
        <div className="font-medium">Restore from backup</div>
        <div className="text-sm text-muted-foreground">
          Upload a <code>logpose-backup-*.zip</code> exported above.
        </div>
      </div>
      <Button
        variant="secondary"
        className="gap-2"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        <ArrowCounterClockwise className="size-4" />
        {busy ? "Restoring…" : "Choose backup"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])}
      />
    </div>
  )
}
