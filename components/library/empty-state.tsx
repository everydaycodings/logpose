import Link from "next/link"
import { LogPoseSeal } from "@/components/brand/logpose-seal"
import { Button } from "@/components/ui/button"

export function EmptyState({
  title,
  message,
  actionLabel,
  actionHref,
}: {
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <LogPoseSeal className="size-24 opacity-20" />
      <div>
        <h3 className="font-heading text-3xl">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {actionLabel && actionHref && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  )
}
