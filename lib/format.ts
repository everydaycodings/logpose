/** Format a byte count as a human-readable size. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** Format a duration as a friendly "Xh Ym" / "Xm" / "Xs". */
export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  if (totalMin < 1) return `${Math.round(ms / 1000)}s`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/** Format milliseconds as m:ss (or h:mm:ss). */
export function formatTime(ms: number | null | undefined): string {
  if (!ms || !Number.isFinite(ms) || ms < 0) return "0:00"
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}
