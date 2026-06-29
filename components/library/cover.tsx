"use client"

import { useState } from "react"
import { LogPoseSeal } from "@/components/brand/logpose-seal"
import { cn } from "@/lib/utils"

/**
 * Album/track artwork with a graceful LogPose-seal fallback when there's no
 * cover (or it fails to load). `coverTrackId` pulls a track's cover; pass
 * `coverSrc` to point at a specific endpoint (e.g. an artist/album photo).
 */
export function Cover({
  coverTrackId,
  coverSrc,
  alt,
  className,
  rounded = "rounded-xl",
}: {
  coverTrackId?: string | null
  coverSrc?: string
  alt: string
  className?: string
  rounded?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = coverSrc ?? (coverTrackId ? `/api/cover/${coverTrackId}` : null)
  const showImage = src && !failed

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-muted",
        rounded,
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <LogPoseSeal className="size-1/2 opacity-25" />
        </div>
      )}
    </div>
  )
}
