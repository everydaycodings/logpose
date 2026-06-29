"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Cover } from "@/components/library/cover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateArtist } from "@/lib/actions"

type Data = { id: string; name: string; hasCover: boolean }

export function ArtistEditForm({ data }: { data: Data }) {
  const router = useRouter()
  const [name, setName] = useState(data.name)
  const [saving, setSaving] = useState(false)
  const [coverBust, setCoverBust] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await updateArtist(data.id, name)
    setSaving(false)
    if (res?.ok) {
      toast.success("Saved")
      router.push(`/artist/${data.id}`)
      router.refresh()
    } else {
      toast.error(res?.error ?? "Could not save")
    }
  }

  async function uploadCover(file: File) {
    const fd = new FormData()
    fd.append("cover", file)
    const res = await fetch(`/api/artists/${data.id}/cover`, {
      method: "POST",
      body: fd,
    })
    if (res.ok) {
      toast.success("Photo updated")
      setCoverBust((n) => n + 1)
      router.refresh()
    } else {
      toast.error("Could not update photo")
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 sm:flex-row">
      <div className="flex w-44 shrink-0 flex-col gap-2">
        <Cover
          key={coverBust}
          coverSrc={`/api/artists/${data.id}/cover?v=${coverBust}`}
          alt={name}
          rounded="rounded-full"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
        >
          Change photo
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
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}
