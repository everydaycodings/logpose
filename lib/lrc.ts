// Client-safe LRC parsing (no server-only imports).
export type LrcLine = { timeMs: number; text: string }

/** Parse LRC text into timed lines, sorted by time. */
export function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = []
  for (const raw of lrc.split("\n")) {
    const matches = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)]
    if (matches.length === 0) continue
    const text = raw.replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g, "").trim()
    for (const m of matches) {
      const min = Number(m[1])
      const sec = Number(m[2])
      const frac = m[3] ? Number(m[3].padEnd(3, "0")) : 0
      lines.push({ timeMs: min * 60000 + sec * 1000 + frac, text })
    }
  }
  return lines.sort((a, b) => a.timeMs - b.timeMs)
}
