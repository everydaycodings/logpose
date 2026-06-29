import { once } from "node:events"
import { Readable } from "node:stream"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { ZipArchive } from "archiver"
import type { NextRequest } from "next/server"
import { env } from "@/lib/env"
import { s3 } from "@/lib/s3"
import { dumpDatabase, listAllObjects } from "@/lib/services/export"

export const dynamic = "force-dynamic"

const README = `LogPose backup
============

library.json   Full database export (tracks, artists, albums, playlists).
assets/        Every stored file, keyed exactly as referenced in library.json
               (audio/<id>.mp3 = playback, originals/... = source upload/download,
               covers/<id>.jpg = artwork).

Keep this archive safe — it contains everything needed to restore your library.
`

export async function GET(req: NextRequest) {
  const metadataOnly = req.nextUrl.searchParams.get("metadataOnly") === "1"
  const dump = await dumpDatabase()
  const stamp = new Date().toISOString().slice(0, 10)

  if (metadataOnly) {
    return new Response(JSON.stringify(dump, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="logpose-metadata-${stamp}.json"`,
      },
    })
  }

  // Audio/covers are already compressed, so "store" (level 0) keeps it fast.
  const archive = new ZipArchive({ zlib: { level: 0 } })
  archive.append(JSON.stringify(dump, null, 2), { name: "library.json" })
  archive.append(README, { name: "README.txt" })

  // Stream each object in sequentially to avoid holding many S3 connections
  // (or the whole library) in memory at once.
  ;(async () => {
    try {
      const objects = await listAllObjects()
      for (const { key } of objects) {
        try {
          const res = await s3.send(
            new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
          )
          archive.append(res.Body as Readable, { name: `assets/${key}` })
          await once(archive, "entry")
        } catch {
          // Skip a missing/unreadable object rather than failing the backup.
        }
      }
      await archive.finalize()
    } catch {
      archive.abort()
    }
  })()

  const webStream = Readable.toWeb(archive) as ReadableStream<Uint8Array>
  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="logpose-backup-${stamp}.zip"`,
    },
  })
}
