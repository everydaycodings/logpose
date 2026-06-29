import { execFile } from "node:child_process"
import { readdir } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

const exec = promisify(execFile)

export type YtInfo = {
  title?: string
  track?: string
  artist?: string
  uploader?: string
  channel?: string
  album?: string
  release_year?: number
  upload_date?: string
}

export type YtDownloadResult = {
  audioPath: string
  thumbnailPath?: string
  info: YtInfo
}

/**
 * Download best audio + metadata + thumbnail for a YouTube URL into `dir`.
 * Keeps the original downloaded audio (we transcode an MP3 separately).
 */
export async function ytDownload(
  url: string,
  dir: string,
): Promise<YtDownloadResult> {
  await exec(
    "yt-dlp",
    [
      "-f",
      "bestaudio/best",
      "--write-info-json",
      "--write-thumbnail",
      "--convert-thumbnails",
      "jpg",
      "--no-playlist",
      "-o",
      path.join(dir, "audio.%(ext)s"),
      url,
    ],
    { maxBuffer: 1024 * 1024 * 32 },
  )

  const files = await readdir(dir)
  const audio = files.find(
    (f) => f.startsWith("audio.") && !f.endsWith(".info.json") && !f.endsWith(".jpg"),
  )
  if (!audio) throw new Error("yt-dlp produced no audio file")

  const infoFile = files.find((f) => f.endsWith(".info.json"))
  const thumb = files.find((f) => f.endsWith(".jpg"))

  let info: YtInfo = {}
  if (infoFile) {
    const { readFile } = await import("node:fs/promises")
    info = JSON.parse(await readFile(path.join(dir, infoFile), "utf8")) as YtInfo
  }

  return {
    audioPath: path.join(dir, audio),
    thumbnailPath: thumb ? path.join(dir, thumb) : undefined,
    info,
  }
}

/** Transcode any input to a browser-friendly MP3 (VBR ~190kbps). */
export async function transcodeToMp3(input: string, output: string) {
  await exec(
    "ffmpeg",
    [
      "-y",
      "-i",
      input,
      "-vn",
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "2",
      output,
    ],
    { maxBuffer: 1024 * 1024 * 32 },
  )
}

/** Probe duration in milliseconds via ffprobe; null if it can't be read. */
export async function probeDurationMs(file: string): Promise<number | null> {
  try {
    const { stdout } = await exec("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ])
    const seconds = parseFloat(stdout.trim())
    return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null
  } catch {
    return null
  }
}
