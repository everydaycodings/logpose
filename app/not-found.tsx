import Link from "next/link"

import { Button } from "@/components/ui/button"

/**
 * Global 404. Rendered inside the root layout (fonts + theme) but outside the
 * app sidebar, so it stands alone. The Log Pose motif returns here with a
 * needle that sweeps — a compass that can't lock onto an island at these
 * coordinates.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-7 px-6 py-16 text-center">
      <style>{needleAnimation}</style>

      <LostLogPose className="size-36 text-seal sm:size-40" />

      <p className="font-mono text-[0.7rem] tracking-[0.3em] text-muted-foreground uppercase">
        0°00′N · 0°00′W
      </p>

      <div className="space-y-2">
        <h1 className="font-heading text-6xl leading-none">Off the map</h1>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          The Log Pose can&rsquo;t find its bearing here — there&rsquo;s no
          island at these coordinates.
        </p>
      </div>

      <Button asChild size="lg">
        <Link href="/">Set a new course</Link>
      </Button>
    </main>
  )
}

const needleAnimation = `
  @keyframes logpose-search {
    0%, 100% { transform: rotate(-34deg); }
    50%      { transform: rotate(30deg); }
  }
  .logpose-needle {
    transform-box: fill-box;
    transform-origin: center;
    animation: logpose-search 7s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .logpose-needle { animation: none; transform: rotate(18deg); }
  }
`

/**
 * The Log Pose motif from the brand seal, re-cut so the needle can search on
 * its own while the bezel, rose, and dial stay fixed.
 */
function LostLogPose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden className={className}>
      {/* Bezel of the glass orb */}
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3" />
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Glass highlight, upper-left */}
      <path
        d="M24 40A30 30 0 0 1 40 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* Fixed north index, set into the bezel */}
      <path d="M50 4 46.5 9.5h7Z" fill="currentColor" />
      {/* Dial ticks: cardinals long, intercardinals short */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="50" y1="11" x2="50" y2="17" />
        <line x1="50" y1="89" x2="50" y2="83" />
        <line x1="89" y1="50" x2="83" y2="50" />
        <line x1="11" y1="50" x2="17" y2="50" />
      </g>
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      >
        <line x1="78.3" y1="21.7" x2="75.4" y2="24.6" />
        <line x1="78.3" y1="78.3" x2="75.4" y2="75.4" />
        <line x1="21.7" y1="78.3" x2="24.6" y2="75.4" />
        <line x1="21.7" y1="21.7" x2="24.6" y2="24.6" />
      </g>
      {/* Needle + east-west arm sweep together, searching for a bearing */}
      <g className="logpose-needle">
        <path d="M74 50 50 53 26 50 50 47Z" fill="currentColor" opacity="0.3" />
        <path d="M50 22 53.5 50 46.5 50Z" fill="currentColor" />
        <path d="M50 78 53.5 50 46.5 50Z" fill="currentColor" opacity="0.4" />
      </g>
      {/* Center hub */}
      <circle cx="50" cy="50" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="1.8" fill="currentColor" />
    </svg>
  )
}
