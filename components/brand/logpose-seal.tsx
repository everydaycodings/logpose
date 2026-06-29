import { cn } from "@/lib/utils"

/**
 * The app's signature motif: a Log Pose — the glass-orb compass that locks
 * onto an island's magnetic field. A beveled bezel, a compass rose, and a
 * needle pointing north. Uses `currentColor`, so set the text color (we use
 * `text-seal`) on the parent. Reused for the brand mark, loading, and empty
 * states.
 */
export function LogPoseSeal({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className={cn("text-seal", className)}
      {...props}
    >
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
      {/* Compass rose: east-west arm sits behind, faint */}
      <path
        d="M74 50 50 53 26 50 50 47Z"
        fill="currentColor"
        opacity="0.3"
      />
      {/* Needle: north half locked on, south half faded */}
      <path d="M50 22 53.5 50 46.5 50Z" fill="currentColor" />
      <path d="M50 78 53.5 50 46.5 50Z" fill="currentColor" opacity="0.4" />
      {/* Center hub */}
      <circle cx="50" cy="50" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="1.8" fill="currentColor" />
    </svg>
  )
}
