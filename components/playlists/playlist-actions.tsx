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
import { confirm, promptDialog } from "@/lib/dialog"

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
            const next = await promptDialog({
              title: "Rename playlist",
              label: "Playlist name",
              defaultValue: name,
              confirmLabel: "Rename",
            })
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
            const ok = await confirm({
              title: "Delete playlist?",
              description: `"${name}" will be removed. Your songs stay in your library.`,
              confirmLabel: "Delete",
              destructive: true,
            })
            if (!ok) return
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
