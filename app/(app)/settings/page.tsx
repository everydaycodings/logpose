import { DownloadSimple, FileText } from "@phosphor-icons/react/dist/ssr"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/format"
import { getLibraryStats } from "@/lib/services/export"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const stats = await getLibraryStats()

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
        <h2 className="mb-3 font-heading text-2xl">Your library</h2>
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
          Take everything with you. The full backup bundles your database and all{" "}
          {stats.assetCount} files ({formatBytes(stats.totalBytes)}) into one
          archive.
        </p>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-5">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="font-medium">Full backup</div>
              <div className="text-sm text-muted-foreground">
                Metadata + every audio file and cover (.zip,{" "}
                {formatBytes(stats.totalBytes)})
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
                Just the database as JSON — small and quick.
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
    </div>
  )
}
