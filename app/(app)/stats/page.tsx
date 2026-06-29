import type { Metadata } from "next"
import { ArtistCard, CardGrid } from "@/components/library/media-cards"
import { TrackList } from "@/components/library/track-list"
import { Section } from "@/components/layout/section"
import { EmptyState } from "@/components/library/empty-state"
import { formatDuration } from "@/lib/format"
import { getLeastPlayed, getMostPlayed } from "@/lib/services/queries"
import { getListeningStats, getOnThisDay } from "@/lib/services/stats"

export const metadata: Metadata = { title: "Stats" }

export default async function StatsPage() {
  const [stats, onThisDay, mostPlayed, leastPlayed] = await Promise.all([
    getListeningStats(),
    getOnThisDay(),
    getMostPlayed(6),
    getLeastPlayed(6),
  ])

  if (stats.totalPlays === 0) {
    return (
      <EmptyState
        title="No voyages yet"
        message="Play some music and your listening stats will chart themselves here."
      />
    )
  }

  const maxCount = Math.max(1, ...stats.activity.map((a) => a.count))

  const headline = [
    { label: "Total plays", value: String(stats.totalPlays) },
    { label: "Time at sea", value: formatDuration(stats.totalListeningMs) },
    { label: "Day streak", value: `${stats.streak} 🔥` },
  ]

  return (
    <div>
      <h1 className="mb-8 font-heading text-5xl">Stats</h1>

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {headline.map((h) => (
          <div key={h.label} className="rounded-2xl border border-border bg-card/50 p-5">
            <div className="font-heading text-4xl">{h.value}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {h.label}
            </div>
          </div>
        ))}
      </div>

      <Section title="Last 30 days">
        <div className="flex h-32 items-end gap-1 rounded-2xl border border-border bg-card/50 p-4">
          {stats.activity.map((a) => (
            <div
              key={a.date}
              title={`${a.date}: ${a.count} play${a.count === 1 ? "" : "s"}`}
              className="flex-1 rounded-t bg-seal/80 transition-all hover:bg-seal"
              style={{ height: `${Math.max(2, (a.count / maxCount) * 100)}%` }}
            />
          ))}
        </div>
      </Section>

      {stats.topArtists.length > 0 && (
        <Section title="Top artists">
          <CardGrid>
            {stats.topArtists.map((a) => (
              <ArtistCard
                key={a.id}
                artist={{
                  id: a.id,
                  name: a.name,
                  trackCount: a.plays,
                  trackId: a.trackId,
                }}
              />
            ))}
          </CardGrid>
        </Section>
      )}

      {stats.topTracks.length > 0 && (
        <Section title="Top songs">
          <div className="rounded-2xl bg-card/50 p-2">
            <TrackList tracks={stats.topTracks} numbered showPlayCount />
          </div>
        </Section>
      )}

      {(mostPlayed.length > 0 || leastPlayed.length > 0) && (
        <div className="grid gap-x-8 md:grid-cols-2">
          {mostPlayed.length > 0 && (
            <Section title="On repeat">
              <div className="rounded-2xl bg-card/50 p-2">
                <TrackList tracks={mostPlayed} showPlayCount showCover={false} />
              </div>
            </Section>
          )}
          {leastPlayed.length > 0 && (
            <Section title="Hidden gems">
              <div className="rounded-2xl bg-card/50 p-2">
                <TrackList tracks={leastPlayed} showPlayCount showCover={false} />
              </div>
            </Section>
          )}
        </div>
      )}

      {onThisDay.length > 0 && (
        <Section title="On this day">
          <div className="rounded-2xl bg-card/50 p-2">
            <TrackList tracks={onThisDay} />
          </div>
        </Section>
      )}
    </div>
  )
}
