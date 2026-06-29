"use client"

import { Plus } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { JollySeal } from "@/components/brand/jolly-seal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createPlaylist } from "@/lib/actions"

export function CreatePlaylistDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    const id = await createPlaylist(trimmed)
    setSaving(false)
    if (id) {
      setOpen(false)
      setName("")
      router.push(`/playlist/${id}`)
      router.refresh()
    } else {
      toast.error("Couldn't create that playlist")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setName("")
      }}
    >
      <button
        type="button"
        aria-label="New playlist"
        onClick={() => setOpen(true)}
        className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Plus className="size-4" />
      </button>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <JollySeal className="mb-1 size-12 opacity-90" />
          <DialogTitle className="font-heading text-3xl">New playlist</DialogTitle>
          <DialogDescription>Give your new collection a name.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grand Line favorites"
            aria-label="Playlist name"
            maxLength={120}
            className="h-11"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Creating…" : "Create playlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
