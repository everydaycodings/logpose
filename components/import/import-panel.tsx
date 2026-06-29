"use client"

import {
  CheckCircle,
  Spinner,
  UploadSimple,
  WarningCircle,
  YoutubeLogo,
} from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type Job = {
  id: string
  type: "UPLOAD" | "YOUTUBE"
  status: "QUEUED" | "DOWNLOADING" | "TRANSCODING" | "FETCHING_META" | "DONE" | "FAILED"
  progress: number
  filename: string | null
  sourceUrl: string | null
  error: string | null
}

const STATUS_LABEL: Record<Job["status"], string> = {
  QUEUED: "Queued",
  DOWNLOADING: "Downloading",
  TRANSCODING: "Transcoding",
  FETCHING_META: "Fetching details",
  DONE: "Done",
  FAILED: "Failed",
}

export function ImportPanel() {
  const [url, setUrl] = useState("")
  const [busy, setBusy] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  // Poll job status.
  useEffect(() => {
    let active = true
    async function poll() {
      try {
        const res = await fetch("/api/import/jobs")
        const data = await res.json()
        if (active) setJobs(data.jobs ?? [])
      } catch {
        /* ignore */
      }
    }
    poll()
    const t = setInterval(poll, 1800)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [])

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setBusy(true)
    const res = await fetch("/api/import/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    })
    setBusy(false)
    if (res.ok) {
      setUrl("")
      toast.success("Added to the import queue")
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? "Could not add that link")
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return
    const form = new FormData()
    list.forEach((f) => form.append("files", f))
    setBusy(true)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    setBusy(false)
    if (res.ok) toast.success(`Uploading ${list.length} file(s)`)
    else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? "Upload failed")
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* YouTube */}
        <form
          onSubmit={submitUrl}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5"
        >
          <div className="flex items-center gap-2">
            <YoutubeLogo className="size-5 text-seal" />
            <h2 className="font-heading text-2xl">From a link</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Paste a YouTube link. We’ll pull the audio, cover art, and details.
          </p>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              aria-label="YouTube URL"
            />
            <Button type="submit" disabled={busy || !url.trim()}>
              Add
            </Button>
          </div>
        </form>

        {/* Upload */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            uploadFiles(e.dataTransfer.files)
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition-colors",
            dragOver ? "border-seal bg-accent/40" : "border-border bg-card/50",
          )}
        >
          <UploadSimple className="size-6 text-muted-foreground" />
          <h2 className="font-heading text-2xl">From your files</h2>
          <p className="text-sm text-muted-foreground">
            Drag audio files here, or
          </p>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            Choose files
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.flac,.m4a,.opus,.ogg"
            multiple
            hidden
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Job list */}
      {jobs.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-2xl">Recent imports</h2>
          <ul className="flex flex-col gap-2">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function JobRow({ job }: { job: Job }) {
  const label = job.filename ?? job.sourceUrl ?? "Import"
  const active = !["DONE", "FAILED"].includes(job.status)
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
      <div className="shrink-0">
        {job.status === "DONE" ? (
          <CheckCircle weight="fill" className="size-5 text-seal" />
        ) : job.status === "FAILED" ? (
          <WarningCircle weight="fill" className="size-5 text-destructive" />
        ) : (
          <Spinner className="size-5 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">
          {job.status === "FAILED"
            ? (job.error ?? "Failed")
            : STATUS_LABEL[job.status]}
        </div>
        {active && <Progress value={job.progress} className="mt-1.5 h-1" />}
      </div>
    </li>
  )
}
