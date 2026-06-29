import { db } from "@/lib/db"
import { normalizeKey } from "@/lib/slug"
import { listAllObjects } from "./export"

export type DuplicateGroup = {
  key: string
  tracks: {
    id: string
    title: string
    artist: string | null
    playCount: number
    hasCover: boolean
  }[]
}

/** Tracks sharing a normalized title + artist (likely duplicates). */
export async function findDuplicates(): Promise<DuplicateGroup[]> {
  const tracks = await db.track.findMany({
    include: { artist: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  })
  const groups = new Map<string, DuplicateGroup["tracks"]>()
  for (const t of tracks) {
    const key = `${normalizeKey(t.title)}::${normalizeKey(t.artist?.name ?? "")}`
    const entry = groups.get(key) ?? []
    entry.push({
      id: t.id,
      title: t.title,
      artist: t.artist?.name ?? null,
      playCount: t.playCount,
      hasCover: Boolean(t.coverKey),
    })
    groups.set(key, entry)
  }
  return [...groups.entries()]
    .filter(([, v]) => v.length > 1)
    .map(([key, v]) => ({ key, tracks: v }))
}

/** Object-storage keys not referenced by any track/album/artist. */
export async function findOrphans(): Promise<{
  keys: string[]
  totalBytes: number
}> {
  const [objects, tracks, albums, artists] = await Promise.all([
    listAllObjects(),
    db.track.findMany({
      select: { mp3Key: true, originalKey: true, coverKey: true },
    }),
    db.album.findMany({ select: { coverKey: true } }),
    db.artist.findMany({ select: { coverKey: true } }),
  ])
  const referenced = new Set<string>()
  for (const t of tracks) {
    for (const k of [t.mp3Key, t.originalKey, t.coverKey]) if (k) referenced.add(k)
  }
  for (const a of albums) if (a.coverKey) referenced.add(a.coverKey)
  for (const a of artists) if (a.coverKey) referenced.add(a.coverKey)

  const orphans = objects.filter((o) => !referenced.has(o.key))
  return {
    keys: orphans.map((o) => o.key),
    totalBytes: orphans.reduce((s, o) => s + o.size, 0),
  }
}
