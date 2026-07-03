import "dotenv/config" // load DATABASE_URL etc. before anything reads env

import { db } from "@/lib/db"
import { deleteCoverIfUnreferenced } from "@/lib/services/library"
import { albumSlug, normalizeKey } from "@/lib/slug"

/**
 * One-off cleanup: merge artists/albums that collapse to the same normalized
 * key (case, punctuation, underscores/hyphens, accents) into a single row, and
 * recompute every slug with the current `normalizeKey`.
 *
 * Run:  npx tsx scripts/dedup-library.ts          (apply)
 *       npx tsx scripts/dedup-library.ts --dry     (report only, no writes)
 */

const DRY = process.argv.includes("--dry")

/** Pick the row to keep: prefer one with a cover, then more content, then oldest. */
function score(a: {
  coverKey: string | null
  createdAt: Date
  _count: { tracks: number; albums?: number }
}): [number, number, number] {
  const content = a._count.tracks + (a._count.albums ?? 0)
  return [a.coverKey ? 1 : 0, content, -a.createdAt.getTime()]
}

function better(a: ReturnType<typeof score>, b: ReturnType<typeof score>) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return false
}

async function dedupArtists() {
  const artists = await db.artist.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      coverKey: true,
      createdAt: true,
      _count: { select: { tracks: true, albums: true } },
    },
  })

  const groups = new Map<string, typeof artists>()
  for (const a of artists) {
    const key = normalizeKey(a.name)
    const g = groups.get(key)
    if (g) g.push(a)
    else groups.set(key, [a])
  }

  for (const [key, group] of groups) {
    let canonical = group[0]
    for (const a of group) if (better(score(a), score(canonical))) canonical = a
    const losers = group.filter((a) => a.id !== canonical.id)

    if (losers.length > 0) {
      console.log(
        `artist "${canonical.name}" (${key}): merging ${losers.length} duplicate(s): ${losers
          .map((l) => `"${l.name}"`)
          .join(", ")}`,
      )
    }
    if (DRY) continue

    for (const loser of losers) {
      await db.album.updateMany({
        where: { artistId: loser.id },
        data: { artistId: canonical.id },
      })
      await db.track.updateMany({
        where: { artistId: loser.id },
        data: { artistId: canonical.id },
      })
      // Adopt a cover if the survivor has none.
      if (!canonical.coverKey && loser.coverKey) {
        await db.artist.update({
          where: { id: canonical.id },
          data: { coverKey: loser.coverKey },
        })
        canonical.coverKey = loser.coverKey
      }
      await db.artist.delete({ where: { id: loser.id } })
      await deleteCoverIfUnreferenced(loser.coverKey)
    }

    // Reslug the survivor (two-phase to dodge any transient unique clash).
    if (canonical.slug !== key) {
      await db.artist.update({
        where: { id: canonical.id },
        data: { slug: `tmp_${canonical.id}` },
      })
      await db.artist.update({ where: { id: canonical.id }, data: { slug: key } })
    }
  }
}

async function dedupAlbums() {
  // Re-read after artists merged so we group by the surviving artist's name.
  const albums = await db.album.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      coverKey: true,
      createdAt: true,
      artist: { select: { name: true } },
      _count: { select: { tracks: true } },
    },
  })

  const groups = new Map<string, typeof albums>()
  for (const al of albums) {
    const key = albumSlug(al.artist.name, al.title)
    const g = groups.get(key)
    if (g) g.push(al)
    else groups.set(key, [al])
  }

  for (const [key, group] of groups) {
    let canonical = group[0]
    for (const al of group) if (better(score(al), score(canonical))) canonical = al
    const losers = group.filter((al) => al.id !== canonical.id)

    if (losers.length > 0) {
      console.log(
        `album "${canonical.artist.name} — ${canonical.title}": merging ${losers.length} duplicate(s)`,
      )
    }
    if (DRY) continue

    for (const loser of losers) {
      await db.track.updateMany({
        where: { albumId: loser.id },
        data: { albumId: canonical.id },
      })
      if (!canonical.coverKey && loser.coverKey) {
        await db.album.update({
          where: { id: canonical.id },
          data: { coverKey: loser.coverKey },
        })
        canonical.coverKey = loser.coverKey
      }
      await db.album.delete({ where: { id: loser.id } })
      await deleteCoverIfUnreferenced(loser.coverKey)
    }

    if (canonical.slug !== key) {
      await db.album.update({
        where: { id: canonical.id },
        data: { slug: `tmp_${canonical.id}` },
      })
      await db.album.update({ where: { id: canonical.id }, data: { slug: key } })
    }
  }
}

async function main() {
  console.log(DRY ? "Dry run — no changes will be written.\n" : "Applying changes…\n")
  await dedupArtists()
  await dedupAlbums()
  console.log("\nDone.")
  await db.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await db.$disconnect()
  process.exit(1)
})
