import { useEffect, useState } from "react"

/**
 * Sample an average accent color from a track's cover (same-origin, so the
 * canvas isn't tainted). Returns an `rgb(...)` string, or null when there's
 * no cover or it can't be read.
 */
export function useAlbumColor(
  trackId: string | undefined,
  hasCover: boolean,
): string | null {
  const [color, setColor] = useState<string | null>(null)

  useEffect(() => {
    setColor(null)
    if (!trackId || !hasCover) return
    let cancelled = false

    const img = new Image()
    img.src = `/api/cover/${trackId}`
    img.onload = () => {
      if (cancelled) return
      try {
        const size = 24
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        let r = 0,
          g = 0,
          b = 0,
          n = 0
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]!
          if (alpha < 125) continue
          r += data[i]!
          g += data[i + 1]!
          b += data[i + 2]!
          n++
        }
        if (n === 0) return
        setColor(`rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`)
      } catch {
        /* tainted or unreadable — ignore */
      }
    }
    return () => {
      cancelled = true
    }
  }, [trackId, hasCover])

  return color
}
