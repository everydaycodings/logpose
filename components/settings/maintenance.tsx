"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteOrphans, deleteTrack } from "@/lib/actions"
import { confirm } from "@/lib/dialog"
import { formatBytes } from "@/lib/format"
import type { DuplicateGroup } from "@/lib/services/maintenance"

export function Maintenance({
  duplicates,
  orphans,
}: {
  duplicates: DuplicateGroup[]
  orphans: { count: number; totalBytes: number }
}) {
  const router = useRouter()
  const [cleaning, setCleaning] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {/* Orphans */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card/50 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="font-medium">Orphaned files</div>
          <div className="text-sm text-muted-foreground">
            Audio or cover files left in storage that no song points to anymore
            (e.g. after deletions or failed imports).{" "}
            {orphans.count === 0
              ? "None right now — storage is tidy."
              : `Found ${orphans.count}, using ${formatBytes(orphans.totalBytes)}. Cleaning up frees that space.`}
          </div>
        </div>
        {orphans.count > 0 && (
          <Button
            variant="secondary"
            disabled={cleaning}
            onClick={async () => {
              const ok = await confirm({
                title: "Clean up orphaned files?",
                description: `${orphans.count} unreferenced file(s) will be permanently deleted from storage.`,
                confirmLabel: "Delete",
                destructive: true,
              })
              if (!ok) return
              setCleaning(true)
              const res = await deleteOrphans()
              setCleaning(false)
              toast.success(`Removed ${res.deleted} file(s)`)
              router.refresh()
            }}
          >
            {cleaning ? "Cleaning…" : "Clean up"}
          </Button>
        )}
      </div>

      {/* Duplicates */}
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <div className="font-medium">Possible duplicates</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Songs that share the same title and artist — often the same track
          imported twice. Review each group and delete the copies you don’t want.
        </p>
        {duplicates.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No duplicate songs found.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {duplicates.map((g) => (
              <li key={g.key} className="rounded-xl bg-background/60 p-3">
                <div className="mb-2 text-sm font-medium">
                  {g.tracks[0]?.title}
                  <span className="text-muted-foreground">
                    {" "}
                    · {g.tracks[0]?.artist ?? "Unknown"}
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {g.tracks.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <Link
                        href={`/track/${t.id}/edit`}
                        className="truncate text-muted-foreground hover:text-foreground"
                      >
                        {t.playCount} plays{t.hasCover ? " · has cover" : ""}
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Delete track?",
                            description: `"${t.title}" will be removed from your library and storage.`,
                            confirmLabel: "Delete",
                            destructive: true,
                          })
                          if (!ok) return
                          await deleteTrack(t.id)
                          toast.success("Deleted")
                          router.refresh()
                        }}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
