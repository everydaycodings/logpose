"use client"

import { Heart } from "@phosphor-icons/react"
import { useOptimistic, useTransition } from "react"
import { toggleLike } from "@/lib/actions"
import { cn } from "@/lib/utils"

export function LikeButton({
  trackId,
  liked,
  className,
}: {
  trackId: string
  liked: boolean
  className?: string
}) {
  const [optimisticLiked, setOptimistic] = useOptimistic(liked)
  const [, startTransition] = useTransition()

  return (
    <button
      type="button"
      aria-label={optimisticLiked ? "Remove from liked" : "Add to liked"}
      aria-pressed={optimisticLiked}
      onClick={(e) => {
        e.stopPropagation()
        startTransition(async () => {
          setOptimistic(!optimisticLiked)
          await toggleLike(trackId)
        })
      }}
      className={cn(
        "rounded-full p-1.5 text-muted-foreground transition-colors hover:text-seal focus-visible:outline-2 focus-visible:outline-ring",
        optimisticLiked && "text-seal",
        className,
      )}
    >
      <Heart weight={optimisticLiked ? "fill" : "regular"} className="size-[18px]" />
    </button>
  )
}
