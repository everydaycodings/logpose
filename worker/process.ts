import { randomUUID } from "node:crypto"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { parseFile } from "music-metadata"
import { db } from "@/lib/db"
import { putObject } from "@/lib/s3"
import {
  createYoutubeImport,
  setJobStatus,
  updateJob,
} from "@/lib/services/imports"
import { finalizeTrack } from "@/lib/services/library"
import { fetchCoverArt, lookupRecording } from "@/lib/services/metadata"
import {
  probeDurationMs,
  transcodeToMp3,
  ytDownload,
  ytPlaylistEntries,
} from "./audio"
import { downloadToFile, uploadFile } from "./storage"

const CONTENT_TYPE: Record<string, string> = {
  ".webm": "audio/webm",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".opus": "audio/opus",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".wav": "audio/wav",
}

type BaseMeta = {
  title: string
  artist?: string
  album?: string
  year?: number
  genre?: string
  trackNumber?: number
}

/** Process one import job end-to-end. Updates status/progress as it goes. */
export async function processImport(importId: string) {
  const job = await db.importJob.findUnique({ where: { id: importId } })
  if (!job) return
  if (job.status === "DONE") return

  // Playlist: expand into one child job per video, then finish.
  if (job.type === "YOUTUBE_PLAYLIST") {
    try {
      await setJobStatus(importId, "DOWNLOADING", 20)
      const urls = await ytPlaylistEntries(job.sourceUrl!)
      for (const url of urls) await createYoutubeImport(url)
      await updateJob(importId, {
        status: "DONE",
        progress: 100,
        error: `Queued ${urls.length} videos`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Playlist failed"
      await updateJob(importId, { status: "FAILED", error: message.slice(0, 500) })
    }
    return
  }

  const dir = await mkdtemp(path.join(tmpdir(), "jolly-"))
  try {
    let originalPath: string
    let originalKey: string
    let originalContentType: string
    let coverPath: string | undefined
    let base: BaseMeta

    if (job.type === "YOUTUBE") {
      await setJobStatus(importId, "DOWNLOADING", 10)
      const res = await ytDownload(job.sourceUrl!, dir)
      originalPath = res.audioPath
      coverPath = res.thumbnailPath
      const ext = path.extname(originalPath).toLowerCase()
      originalContentType = CONTENT_TYPE[ext] ?? "application/octet-stream"
      originalKey = `originals/${randomUUID()}${ext}`

      const info = res.info
      base = {
        title: info.track || info.title || "Unknown title",
        artist: info.artist || info.uploader || info.channel,
        album: info.album,
        year:
          info.release_year ||
          (info.upload_date
            ? Number(info.upload_date.slice(0, 4)) || undefined
            : undefined),
      }
    } else {
      // UPLOAD: original already lives at job.uploadKey — reuse it as-is.
      await setJobStatus(importId, "DOWNLOADING", 10)
      originalKey = job.uploadKey!
      const ext = path.extname(job.filename ?? originalKey).toLowerCase()
      originalContentType = CONTENT_TYPE[ext] ?? "audio/mpeg"
      originalPath = path.join(dir, `original${ext || ".bin"}`)
      await downloadToFile(originalKey, originalPath)

      base = await readTags(originalPath, job.filename ?? "Unknown title")
      // Embedded cover art, if any.
      const meta = await parseFile(originalPath).catch(() => null)
      const pic = meta?.common.picture?.[0]
      if (pic) {
        coverPath = path.join(dir, "cover.jpg")
        await writeFile(coverPath, Buffer.from(pic.data))
      }
    }

    // Transcode to a browser-friendly MP3.
    await setJobStatus(importId, "TRANSCODING", 40)
    const mp3Path = path.join(dir, "playback.mp3")
    await transcodeToMp3(originalPath, mp3Path)
    const durationMs = await probeDurationMs(mp3Path)

    // Enrich missing fields + cover from MusicBrainz / Cover Art Archive.
    await setJobStatus(importId, "FETCHING_META", 65)
    const enriched = await lookupRecording(base.title, base.artist).catch(
      () => null,
    )
    const artist = base.artist || enriched?.artist
    const album = base.album || enriched?.album
    const year = base.year || enriched?.year
    const mbid = enriched?.mbid

    let coverBuffer: Buffer | null = null
    if (coverPath) {
      const { readFile } = await import("node:fs/promises")
      coverBuffer = await readFile(coverPath)
    } else if (enriched?.releaseMbid) {
      coverBuffer = await fetchCoverArt(enriched.releaseMbid)
    }

    // Upload artifacts.
    await setJobStatus(importId, "FETCHING_META", 85)
    const id = randomUUID()
    const mp3Key = `audio/${id}.mp3`
    await uploadFile(mp3Path, mp3Key, "audio/mpeg")

    if (job.type === "YOUTUBE") {
      await uploadFile(originalPath, originalKey, originalContentType)
    }

    let coverKey: string | undefined
    if (coverBuffer) {
      coverKey = `covers/${id}.jpg`
      await putObject(coverKey, coverBuffer, "image/jpeg")
    }

    const track = await finalizeTrack({
      title: base.title,
      artistName: artist,
      albumTitle: album,
      year,
      genre: base.genre,
      trackNumber: base.trackNumber,
      durationMs: durationMs ?? undefined,
      source: job.type === "UPLOAD" ? "UPLOAD" : "YOUTUBE",
      sourceUrl: job.sourceUrl ?? undefined,
      mbid,
      originalKey,
      mp3Key,
      coverKey,
    })

    await updateJob(importId, {
      status: "DONE",
      progress: 100,
      trackId: track.id,
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed"
    await updateJob(importId, { status: "FAILED", error: message.slice(0, 500) })
    throw err
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function readTags(file: string, fallbackName: string): Promise<BaseMeta> {
  const meta = await parseFile(file).catch(() => null)
  const c = meta?.common
  const title =
    c?.title || fallbackName.replace(/\.[^.]+$/, "") || "Unknown title"
  return {
    title,
    artist: c?.artist,
    album: c?.album,
    year: c?.year,
    genre: c?.genre?.[0],
    trackNumber: c?.track?.no ?? undefined,
  }
}
