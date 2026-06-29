"use client"

import { X } from "@phosphor-icons/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePlayer } from "@/store/player"

export function QueuePanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queue = usePlayer((s) => s.queue)
  const index = usePlayer((s) => s.index)
  const jumpTo = usePlayer((s) => s.jumpTo)
  const removeAt = usePlayer((s) => s.removeAt)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl">Up Next</SheetTitle>
        </SheetHeader>
        <ol className="flex-1 overflow-y-auto px-2 pb-4">
          {queue.map((t, i) => (
            <li
              key={`${t.id}-${i}`}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/60",
                i === index && "bg-accent/50",
              )}
            >
              <button
                type="button"
                onClick={() => jumpTo(i)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {t.hasCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/cover/${t.id}`}
                    alt=""
                    className="size-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="size-10 rounded-md bg-muted" />
                )}
                <div className="min-w-0">
                  <div
                    className={cn(
                      "truncate text-sm",
                      i === index && "font-medium text-seal",
                    )}
                  >
                    {t.title}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.artist ?? "Unknown artist"}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove from queue"
                className="rounded-full p-1.5 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
          {queue.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              The queue is empty.
            </p>
          )}
        </ol>
      </SheetContent>
    </Sheet>
  )
}
