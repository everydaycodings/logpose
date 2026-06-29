"use client"

import { DotsThree } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deletePlaylist, renamePlaylist } from "@/lib/actions"

export function PlaylistActions({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Playlist options"
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <DotsThree weight="bold" className="size-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem
          onSelect={async () => {
            const next = window.prompt("Rename playlist", name)
            if (!next) return
            await renamePlaylist(id, next)
            router.refresh()
          }}
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={async () => {
            if (!window.confirm(`Delete playlist "${name}"?`)) return
            await deletePlaylist(id)
            toast.success("Playlist deleted")
            router.push("/")
            router.refresh()
          }}
        >
          Delete playlist
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
