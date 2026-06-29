"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Cover } from "@/components/library/cover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { reenrichTrack, updateTrack } from "@/lib/actions"

type Data = {
  id: string
  title: string
  artist: string
  album: string
  year?: number
  genre: string
  lyrics: string
  hasCover: boolean
}

export function EditForm({ data }: { data: Data }) {
  const router = useRouter()
  const [form, setForm] = useState(data)
  const [saving, setSaving] = useState(false)
  const [coverBust, setCoverBust] = useState(0)
  const [refetching, setRefetching] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof Data>(key: K, value: Data[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await updateTrack(data.id, {
      title: form.title,
      artist: form.artist || undefined,
      album: form.album || undefined,
      year: form.year,
      genre: form.genre || undefined,
      lyrics: form.lyrics || undefined,
    })
    setSaving(false)
    if (res?.ok) {
      toast.success("Saved")
      router.refresh()
    } else {
      toast.error(res?.error ?? "Could not save")
    }
  }

  async function uploadCover(file: File) {
    const fd = new FormData()
    fd.append("cover", file)
    const res = await fetch(`/api/tracks/${data.id}/cover`, {
      method: "POST",
      body: fd,
    })
    if (res.ok) {
      toast.success("Cover updated")
      setCoverBust((n) => n + 1)
      router.refresh()
    } else {
      toast.error("Could not update cover")
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 sm:flex-row">
      <div className="flex w-44 shrink-0 flex-col gap-2">
        <Cover
          key={coverBust}
          coverTrackId={form.hasCover || coverBust ? data.id : null}
          alt={form.title}
          rounded="rounded-2xl"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
        >
          Change cover
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
        />
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <Field label="Title">
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Artist">
            <Input
              value={form.artist}
              onChange={(e) => set("artist", e.target.value)}
            />
          </Field>
          <Field label="Album">
            <Input
              value={form.album}
              onChange={(e) => set("album", e.target.value)}
            />
          </Field>
          <Field label="Year">
            <Input
              type="number"
              value={form.year ?? ""}
              onChange={(e) =>
                set("year", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </Field>
          <Field label="Genre">
            <Input
              value={form.genre}
              onChange={(e) => set("genre", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Lyrics">
          <Textarea
            value={form.lyrics}
            onChange={(e) => set("lyrics", e.target.value)}
            rows={8}
            placeholder="Paste lyrics here…"
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={refetching}
            onClick={async () => {
              setRefetching(true)
              const res = await reenrichTrack(data.id)
              setRefetching(false)
              if (res?.ok) {
                toast.success("Metadata refreshed")
                setCoverBust((n) => n + 1)
                router.refresh()
              } else {
                toast.error(res?.error ?? "Could not refresh")
              }
            }}
          >
            {refetching ? "Searching…" : "Re-fetch metadata"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
