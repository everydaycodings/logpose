import { Cover } from "@/components/library/cover"

export function CollectionHeader({
  eyebrow,
  title,
  subtitle,
  coverTrackId,
  round = false,
  children,
}: {
  eyebrow: string
  title: string
  subtitle?: React.ReactNode
  coverTrackId: string | null
  round?: boolean
  children?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end">
      <Cover
        coverTrackId={coverTrackId}
        alt={title}
        rounded={round ? "rounded-full" : "rounded-2xl"}
        className="w-40 shrink-0 shadow-lg sm:w-52"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-heading text-5xl leading-tight sm:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </header>
  )
}
