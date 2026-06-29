import { MobileHeader } from "@/components/layout/mobile-header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Sidebar } from "@/components/layout/sidebar"
import { CommandPalette } from "@/components/player/command-palette"
import { KeyboardShortcuts } from "@/components/player/keyboard-shortcuts"
import { PlayerBar } from "@/components/player/player-bar"
import { PlayerEngine } from "@/components/player/player-engine"
import { ServiceWorkerRegister } from "@/components/pwa/sw-register"
import { DialogHost } from "@/components/ui/dialog-host"
import { getPlaylists } from "@/lib/services/queries"

// The library changes whenever music is imported, so always render fresh
// (no build-time prerendering of personal data).
export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const playlists = await getPlaylists()

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <Sidebar playlists={playlists.map((p) => ({ id: p.id, name: p.name }))} />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <MobileHeader />
          <div className="mx-auto max-w-screen-2xl px-4 py-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
      <PlayerBar />
      <MobileNav />
      <PlayerEngine />
      <KeyboardShortcuts />
      <CommandPalette />
      <DialogHost />
      <ServiceWorkerRegister />
    </div>
  )
}
