"use client"

import { useState } from "react"
import { JollySeal } from "@/components/brand/jolly-seal"
import { cn } from "@/lib/utils"

/**
 * Album/track artwork with a graceful Jolly-seal fallback when there's no
 * cover (or it fails to load). `coverTrackId` is the track whose cover we pull.
 */
export function Cover({
  coverTrackId,
  alt,
  className,
  rounded = "rounded-xl",
}: {
  coverTrackId: string | null
  alt: string
  className?: string
  rounded?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = coverTrackId && !failed

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
          src={`/api/cover/${coverTrackId}`}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <JollySeal className="size-1/2 opacity-25" />
        </div>
      )}
    </div>
  )
}
