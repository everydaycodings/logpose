"use client"

import { Moon } from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { usePlayer } from "@/store/player"

const OPTIONS = [15, 30, 45, 60]

export function SleepTimer() {
  const sleepAt = usePlayer((s) => s.sleepAt)
  const sleepEndOfTrack = usePlayer((s) => s.sleepEndOfTrack)
  const setSleepTimer = usePlayer((s) => s.setSleepTimer)
  const setSleepEndOfTrack = usePlayer((s) => s.setSleepEndOfTrack)
  const active = sleepAt != null || sleepEndOfTrack

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Sleep timer"
          className={cn(
            "rounded-full px-3 py-1.5 text-sm hover:bg-accent",
            active ? "text-seal" : "text-muted-foreground",
          )}
        >
          <span className="flex items-center gap-1.5">
            <Moon weight={active ? "fill" : "regular"} className="size-4" /> Sleep
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sleep timer</DropdownMenuLabel>
        {OPTIONS.map((m) => (
          <DropdownMenuItem key={m} onSelect={() => setSleepTimer(m)}>
            In {m} minutes
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => setSleepEndOfTrack(true)}>
          At end of track
        </DropdownMenuItem>
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSleepTimer(null)}>
              Turn off
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
