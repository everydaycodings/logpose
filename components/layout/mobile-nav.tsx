"use client"

import {
  ChartBar,
  Disc,
  DotsThreeOutline,
  GearSix,
  Heart,
  House,
  MagnifyingGlass,
  MicrophoneStage,
  MusicNotes,
  SignOut,
  UploadSimple,
} from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SMART_KEYS, SMART_MIXES } from "@/lib/smart"
import { cn } from "@/lib/utils"

type PlaylistLink = { id: string; name: string }

const tabs = [
  { href: "/", label: "Home", icon: House },
  { href: "/search", label: "Search", icon: MagnifyingGlass },
  { href: "/songs", label: "Songs", icon: MusicNotes },
  { href: "/liked", label: "Liked", icon: Heart },
]

const moreLinks = [
  { href: "/albums", label: "Albums", icon: Disc },
  { href: "/artists", label: "Artists", icon: MicrophoneStage },
  { href: "/stats", label: "Stats", icon: ChartBar },
  { href: "/import", label: "Add music", icon: UploadSimple },
  { href: "/settings", label: "Settings", icon: GearSix },
]

export function MobileNav({ playlists }: { playlists: PlaylistLink[] }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = moreLinks.some((l) => l.href === pathname)

  return (
    <nav className="flex shrink-0 items-stretch justify-around border-t border-border bg-card md:hidden">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
              active ? "text-seal" : "text-muted-foreground",
            )}
          >
            <Icon weight={active ? "fill" : "regular"} className="size-5" />
            {label}
          </Link>
        )
      })}

      <button
        type="button"
        onClick={() => setMoreOpen(true)}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
          moreActive ? "text-seal" : "text-muted-foreground",
        )}
      >
        <DotsThreeOutline
          weight={moreActive ? "fill" : "regular"}
          className="size-5"
        />
        More
      </button>

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        playlists={playlists}
      />
    </nav>
  )
}

function MoreSheet({
  open,
  onOpenChange,
  playlists,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlists: PlaylistLink[]
}) {
  const pathname = usePathname()
  const close = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80svh] gap-0">
        <SheetHeader className="flex-row items-center justify-between pr-12">
          <SheetTitle>More</SheetTitle>
          <ThemeSwitcher />
        </SheetHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col gap-1">
            {moreLinks.map(({ href, label, icon: Icon }) => (
              <MoreLink
                key={href}
                href={href}
                active={pathname === href}
                onClick={close}
                icon={<Icon className="size-5" />}
              >
                {label}
              </MoreLink>
            ))}
          </div>

          <Section title="Mixes">
            {SMART_KEYS.map((key) => (
              <MoreLink
                key={key}
                href={`/smart/${key}`}
                active={pathname === `/smart/${key}`}
                onClick={close}
                subtle
              >
                {SMART_MIXES[key].title}
              </MoreLink>
            ))}
          </Section>

          <Section title="Playlists">
            {playlists.map((p) => (
              <MoreLink
                key={p.id}
                href={`/playlist/${p.id}`}
                active={pathname === `/playlist/${p.id}`}
                onClick={close}
                subtle
              >
                {p.name}
              </MoreLink>
            ))}
            {playlists.length === 0 && (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No playlists yet.
              </p>
            )}
          </Section>

          <LogoutButton onClick={close} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <span className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

function MoreLink({
  href,
  icon,
  children,
  active,
  onClick,
  subtle = false,
}: {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
  active: boolean
  onClick: () => void
  subtle?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        subtle && "truncate py-1.5",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  )
}

function LogoutButton({ onClick }: { onClick: () => void }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={async () => {
        onClick()
        await fetch("/api/logout", { method: "POST" })
        router.push("/login")
        router.refresh()
      }}
      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <SignOut className="size-5" />
      <span>Log out</span>
    </button>
  )
}
