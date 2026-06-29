"use client"

import {
  ChartBar,
  Disc,
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
import { LogPoseSeal } from "@/components/brand/logpose-seal"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import { CreatePlaylistDialog } from "@/components/playlists/create-playlist-dialog"
import { SMART_MIXES, SMART_KEYS } from "@/lib/smart"
import { cn } from "@/lib/utils"

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "LogPose"

type PlaylistLink = { id: string; name: string }

export function Sidebar({ playlists }: { playlists: PlaylistLink[] }) {
  return (
    <nav className="flex h-full w-60 shrink-0 flex-col gap-4 border-r border-border bg-sidebar p-3">
      <Link href="/" className="flex items-center gap-2 px-2 pt-1">
        <LogPoseSeal className="size-8" />
        <span className="font-heading text-3xl leading-none">{appName}</span>
      </Link>

      <div className="flex flex-col gap-1">
        <NavLink href="/" icon={<House className="size-5" />}>
          Home
        </NavLink>
        <NavLink href="/search" icon={<MagnifyingGlass className="size-5" />}>
          Search
        </NavLink>
        <NavLink href="/songs" icon={<MusicNotes className="size-5" />}>
          Songs
        </NavLink>
        <NavLink href="/albums" icon={<Disc className="size-5" />}>
          Albums
        </NavLink>
        <NavLink href="/artists" icon={<MicrophoneStage className="size-5" />}>
          Artists
        </NavLink>
        <NavLink href="/liked" icon={<Heart className="size-5" />}>
          Liked
        </NavLink>
        <NavLink href="/stats" icon={<ChartBar className="size-5" />}>
          Stats
        </NavLink>
        <NavLink href="/import" icon={<UploadSimple className="size-5" />}>
          Add music
        </NavLink>
        <NavLink href="/settings" icon={<GearSix className="size-5" />}>
          Settings
        </NavLink>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-2 py-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mixes
          </span>
        </div>
        <div className="mb-2 flex flex-col">
          {SMART_KEYS.map((key) => (
            <NavLink key={key} href={`/smart/${key}`} subtle>
              {SMART_MIXES[key].title}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Playlists
          </span>
          <CreatePlaylistDialog />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {playlists.map((p) => (
            <li key={p.id}>
              <NavLink href={`/playlist/${p.id}`} subtle>
                {p.name}
              </NavLink>
            </li>
          ))}
          {playlists.length === 0 && (
            <li className="px-2 py-2 text-xs text-muted-foreground">
              No playlists yet.
            </li>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2">
        <ThemeSwitcher />
        <LogoutButton />
      </div>
    </nav>
  )
}

function NavLink({
  href,
  icon,
  children,
  subtle = false,
}: {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
  subtle?: boolean
}) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
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

function LogoutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      aria-label="Log out"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" })
        router.push("/login")
        router.refresh()
      }}
      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <SignOut className="size-4" />
    </button>
  )
}
