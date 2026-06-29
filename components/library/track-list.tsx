"use client"

import {
  DotsThree,
  PencilSimple,
  Pause,
  Play,
  Queue,
  SpeakerHigh,
  Trash,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AddToPlaylistSub } from "@/components/library/add-to-playlist"
import { LikeButton } from "@/components/library/like-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteTrack } from "@/lib/actions"
import { formatTime } from "@/lib/format"
import type { PlayableTrack } from "@/lib/types"
import { cn } from "@/lib/utils"
import { current, usePlayer } from "@/store/player"

export function TrackList({
  tracks,
  showCover = true,
  numbered = false,
  showPlayCount = false,
  onRemove,
}: {
  tracks: PlayableTrack[]
  showCover?: boolean
  numbered?: boolean
  /** Show a play-count badge (for stats lists). */
  showPlayCount?: boolean
  /** Optional per-row remove action (e.g. remove from playlist). */
  onRemove?: (trackId: string) => void
}) {
  if (tracks.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-muted-foreground">
        Nothing here yet.
      </p>
    )
  }
  return (
    <ol className="flex flex-col">
      {tracks.map((track, i) => (
        <TrackRow
          key={track.id}
          track={track}
          index={i}
          queue={tracks}
          showCover={showCover}
          numbered={numbered}
          showPlayCount={showPlayCount}
          onRemove={onRemove}
        />
      ))}
    </ol>
  )
}

function TrackRow({
  track,
  index,
  queue,
  showCover,
  numbered,
  showPlayCount,
  onRemove,
}: {
  track: PlayableTrack
  index: number
  queue: PlayableTrack[]
  showCover: boolean
  numbered: boolean
  showPlayCount?: boolean
  onRemove?: (trackId: string) => void
}) {
  const router = useRouter()
  const playQueue = usePlayer((s) => s.playQueue)
  const togglePlay = usePlayer((s) => s.togglePlay)
  const enqueue = usePlayer((s) => s.enqueue)
  const isPlaying = usePlayer((s) => s.isPlaying)
  const activeId = usePlayer((s) => current(s)?.id)

  const isActive = activeId === track.id
  const isThisPlaying = isActive && isPlaying

  function onActivate() {
    if (isActive) togglePlay()
    else playQueue(queue, index)
  }

  return (
    <li
      onDoubleClick={onActivate}
      className={cn(
        "group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/60",
        showCover && "grid-cols-[2rem_auto_1fr_auto]",
        isActive && "bg-accent/40",
      )}
    >
      {/* Index / play toggle */}
      <button
        type="button"
        onClick={onActivate}
        aria-label={isThisPlaying ? "Pause" : `Play ${track.title}`}
        className="flex size-8 items-center justify-center text-sm text-muted-foreground"
      >
        <span className={cn("tabular-nums", "group-hover:hidden", isActive && "hidden")}>
          {numbered ? index + 1 : ""}
        </span>
        {isThisPlaying ? (
          <Pause weight="fill" className="size-4 text-seal" />
        ) : (
          <Play
            weight="fill"
            className={cn(
              "size-4",
              isActive ? "text-seal" : "hidden group-hover:block",
            )}
          />
        )}
      </button>

      {showCover && (
        <CoverThumb trackId={track.id} hasCover={track.hasCover} />
      )}

      {/* Title / artist */}
      <button
        type="button"
        onClick={onActivate}
        className="min-w-0 text-left"
      >
        <div className={cn("truncate text-sm", isActive && "font-medium text-seal")}>
          {track.title}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {track.artist ?? "Unknown artist"}
          {track.album ? ` · ${track.album}` : ""}
        </div>
      </button>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {showPlayCount && (
          <span className="mr-1 hidden items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground sm:inline-flex">
            <Play weight="fill" className="size-2.5" />
            {track.playCount ?? 0}
          </span>
        )}
        <LikeButton trackId={track.id} liked={track.liked} />
        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
          {formatTime(track.durationMs)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More options"
              className="rounded-full p-1.5 text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
              <DotsThree weight="bold" className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => enqueue(track, true)}>
              <SpeakerHigh className="size-4" /> Play next
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => enqueue(track, false)}>
              <Queue className="size-4" /> Add to queue
            </DropdownMenuItem>
            <AddToPlaylistSub trackId={track.id} />
            <DropdownMenuSeparator />
            {track.albumId && (
              <DropdownMenuItem asChild>
                <Link href={`/album/${track.albumId}`}>Go to album</Link>
              </DropdownMenuItem>
            )}
            {track.artistId && (
              <DropdownMenuItem asChild>
                <Link href={`/artist/${track.artistId}`}>Go to artist</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href={`/track/${track.id}/edit`}>
                <PencilSimple className="size-4" /> Edit details
              </Link>
            </DropdownMenuItem>
            {onRemove && (
              <DropdownMenuItem onSelect={() => onRemove(track.id)}>
                <Trash className="size-4" /> Remove from playlist
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={async () => {
                if (!window.confirm(`Delete "${track.title}"? This can't be undone.`))
                  return
                await deleteTrack(track.id)
                toast.success("Track deleted")
                router.refresh()
              }}
            >
              <Trash className="size-4" /> Delete from library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

function CoverThumb({
  trackId,
  hasCover,
}: {
  trackId: string
  hasCover: boolean
}) {
  if (!hasCover) {
    return <div className="size-10 shrink-0 rounded-md bg-muted" />
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/cover/${trackId}`}
      alt=""
      loading="lazy"
      className="size-10 shrink-0 rounded-md object-cover"
    />
  )
}
