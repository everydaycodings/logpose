import { addPending, putTrack, removePending } from "@/lib/offline/db"
import { coverUrl, streamUrl, type PlayableTrack } from "@/lib/types"

// Fetches the full audio body (no Range header → 200), reporting progress
// against Content-Length so bulk downloads can show a bar.
async function fetchAudioBlob(
  id: string,
  onProgress?: (fraction: number) => void,
): Promise<Blob> {
  const res = await fetch(streamUrl(id))
  if (!res.ok || !res.body) throw new Error(`stream ${id}: ${res.status}`)

  const total = Number(res.headers.get("Content-Length")) || 0
  if (!total || !onProgress) return res.blob()

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    onProgress(Math.min(1, received / total))
  }
  return new Blob(chunks as BlobPart[], {
    type: res.headers.get("Content-Type") ?? "audio/mpeg",
  })
}

async function fetchLyrics(id: string) {
  try {
    const res = await fetch(`/api/tracks/${id}/lyrics`)
    if (!res.ok) return { lyrics: null, synced: null }
    const data = (await res.json()) as {
      lyrics: string | null
      synced: string | null
    }
    return { lyrics: data.lyrics ?? null, synced: data.synced ?? null }
  } catch {
    return { lyrics: null, synced: null }
  }
}

/**
 * Downloads a single track (audio + cover + lyrics + metadata) into IndexedDB.
 * Used for both explicit downloads and auto-cache-on-play.
 */
export async function downloadTrack(
  track: PlayableTrack,
  onProgress?: (fraction: number) => void,
) {
  const audio = await fetchAudioBlob(track.id, onProgress)
  const cover = track.hasCover
    ? await fetch(coverUrl(track.id))
        .then((r) => (r.ok ? r.blob() : null))
        .catch(() => null)
    : null
  const { lyrics, synced } = await fetchLyrics(track.id)

  await putTrack({
    id: track.id,
    track,
    audio,
    cover,
    lyrics,
    syncedLyrics: synced,
  })
}

/**
 * Downloads many tracks sequentially. The whole job is recorded in `pending`
 * up front and each id removed on completion, so an interrupted bulk job resumes
 * the remaining tracks on next load (see store/downloads.ts hydrate).
 */
export async function downloadMany(
  tracks: PlayableTrack[],
  onEach?: (track: PlayableTrack, fraction: number) => void,
) {
  for (const track of tracks) await addPending(track)
  for (const track of tracks) {
    try {
      await downloadTrack(track, (f) => onEach?.(track, f))
    } finally {
      await removePending(track.id)
    }
  }
}
