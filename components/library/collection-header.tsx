import { PencilSimple } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { Cover } from "@/components/library/cover"

export function CollectionHeader({
  eyebrow,
  title,
  subtitle,
  coverTrackId,
  coverSrc,
  editHref,
  round = false,
  children,
}: {
  eyebrow: string
  title: string
  subtitle?: React.ReactNode
  coverTrackId?: string | null
  coverSrc?: string
  editHref?: string
  round?: boolean
  children?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end">
      <Cover
        coverTrackId={coverTrackId}
        coverSrc={coverSrc}
        alt={title}
        rounded={round ? "rounded-full" : "rounded-2xl"}
        className="w-40 shrink-0 shadow-lg sm:w-52"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-heading text-5xl leading-tight sm:text-6xl">
            {title}
          </h1>
          {editHref && (
            <Link
              href={editHref}
              aria-label={`Edit ${title}`}
              className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <PencilSimple className="size-5" />
            </Link>
          )}
        </div>
        {subtitle && (
          <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </header>
  )
}
