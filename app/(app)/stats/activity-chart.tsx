"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Day = { date: string; count: number }

function formatDay(date: string) {
  // date is "YYYY-MM-DD"; render in local terms without timezone drift.
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function ActivityChart({ activity }: { activity: Day[] }) {
  const maxCount = Math.max(1, ...activity.map((a) => a.count))

  return (
    <TooltipProvider delayDuration={80}>
      <div className="flex h-32 items-end gap-1 rounded-2xl border border-border bg-card/50 p-4">
        {activity.map((a) => (
          <Tooltip key={a.date}>
            <TooltipTrigger asChild>
              <div
                className="flex h-full flex-1 cursor-default items-end"
                aria-label={`${formatDay(a.date)}: ${a.count} play${a.count === 1 ? "" : "s"}`}
              >
                <div
                  className="w-full rounded-t bg-seal/80 transition-all hover:bg-seal"
                  style={{ height: `${Math.max(2, (a.count / maxCount) * 100)}%` }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className="tabular-nums font-medium">{a.count}</span>
              <span className="text-background/70">
                {a.count === 1 ? "play" : "plays"} · {formatDay(a.date)}
              </span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
