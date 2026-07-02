import { execFile } from "node:child_process"
import { readdir } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

const exec = promisify(execFile)

// Optional cookies.txt for YouTube's anti-bot check (needed from datacenter/VPS
// IPs). Set YTDLP_COOKIES to a file path to enable; dormant otherwise.
const cookieArgs = process.env.YTDLP_COOKIES
  ? ["--cookies", process.env.YTDLP_COOKIES]
  : []

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
      ...cookieArgs,
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

/** Expand a YouTube playlist URL into individual video watch URLs. */
export async function ytPlaylistEntries(url: string): Promise<string[]> {
  const { stdout } = await exec(
    "yt-dlp",
    ["--flat-playlist", ...cookieArgs, "--print", "%(id)s", url],
    { maxBuffer: 1024 * 1024 * 16 },
  )
  return stdout
    .split("\n")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => `https://www.youtube.com/watch?v=${id}`)
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

/**
 * Measure ReplayGain as a dB adjustment toward a -14 LUFS target (EBU R128),
 * using ffmpeg's loudnorm analysis pass. Returns null if it can't be measured.
 * The value is clamped to ±15 dB to avoid extreme swings on odd inputs.
 */
export async function measureGainDb(file: string): Promise<number | null> {
  const TARGET_LUFS = -14
  try {
    const { stderr } = await exec(
      "ffmpeg",
      [
        "-i",
        file,
        "-af",
        "loudnorm=I=-14:print_format=json",
        "-f",
        "null",
        "-",
      ],
      { maxBuffer: 1024 * 1024 * 16 },
    )
    // The JSON block is the last {...} ffmpeg prints to stderr.
    const match = stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)
    if (!match) return null
    const measuredI = Number(JSON.parse(match[0]).input_i)
    if (!Number.isFinite(measuredI)) return null
    const gain = TARGET_LUFS - measuredI
    return Math.max(-15, Math.min(15, Math.round(gain * 100) / 100))
  } catch {
    return null
  }
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
