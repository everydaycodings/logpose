import { DownloadSimple, FileText } from "@phosphor-icons/react/dist/ssr"
import type { Metadata } from "next"
import { LastfmSettings } from "@/components/settings/lastfm-settings"
import { Maintenance } from "@/components/settings/maintenance"
import { RestorePanel } from "@/components/settings/restore-panel"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/format"
import { getLibraryStats } from "@/lib/services/export"
import { findDuplicates, findOrphans } from "@/lib/services/maintenance"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const [stats, duplicates, orphans] = await Promise.all([
    getLibraryStats(),
    findDuplicates(),
    findOrphans(),
  ])

  const overview = [
    { label: "Songs", value: stats.tracks },
    { label: "Albums", value: stats.albums },
    { label: "Artists", value: stats.artists },
    { label: "Playlists", value: stats.playlists },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-heading text-5xl">Settings</h1>

      <section className="mb-10">
        <h2 className="mb-1 font-heading text-2xl">Your library</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          A quick overview of everything in your collection.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {overview.map((o) => (
            <div
              key={o.label}
              className="rounded-xl border border-border bg-card/50 p-4"
            >
              <div className="text-2xl font-semibold tabular-nums">{o.value}</div>
              <div className="text-xs text-muted-foreground">{o.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 font-heading text-2xl">Backup &amp; export</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Download a copy of your whole library so you never lose it — you can
          re-import it later from the Restore section below. Currently{" "}
          {stats.assetCount} files ({formatBytes(stats.totalBytes)}).
        </p>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="font-medium">Full backup</div>
              <div className="text-sm text-muted-foreground">
                Everything: the database plus every audio file and cover image,
                in one .zip ({formatBytes(stats.totalBytes)}). Use this to move
                Jolly to another server or as a complete safety copy.
              </div>
            </div>
            <Button asChild className="gap-2">
              {/* Plain link: the browser streams the download with progress. */}
              <a href="/api/export" download>
                <DownloadSimple className="size-4" /> Download backup
              </a>
            </Button>
          </div>

          <div className="border-t border-border" />

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="font-medium">Metadata only</div>
              <div className="text-sm text-muted-foreground">
                Just your song details, playlists, and play counts as a small
                JSON file — no audio. Handy for a quick snapshot or inspecting
                your data.
              </div>
            </div>
            <Button asChild variant="secondary" className="gap-2">
              <a href="/api/export?metadataOnly=1" download>
                <FileText className="size-4" /> Download JSON
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 font-heading text-2xl">Restore</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Rebuild your library from a full backup .zip. It re-uploads the audio
          and re-creates songs, albums, and playlists. Safe to re-run — existing
          items are updated, missing ones are added (nothing is deleted).
        </p>
        <RestorePanel />
      </section>

      <section className="mb-10">
        <h2 className="mb-1 font-heading text-2xl">Last.fm</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Optional. When connected, every song you play is “scrobbled” to your
          Last.fm account, building a lifelong listening history and stats that
          span all your apps. It only sends play data — it never affects
          playback, and you can disconnect anytime.
        </p>
        <LastfmSettings />
      </section>

      <section className="mb-10">
        <h2 className="mb-1 font-heading text-2xl">Maintenance</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Keep your library tidy: remove storage files that are no longer linked
          to any song, and find songs that look like duplicates.
        </p>
        <Maintenance
          duplicates={duplicates}
          orphans={{ count: orphans.keys.length, totalBytes: orphans.totalBytes }}
        />
      </section>
    </div>
  )
}
