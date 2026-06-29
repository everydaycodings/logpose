import { cn } from "@/lib/utils"

/**
 * The app's signature motif: a straw-hat skull pressed like a wax seal.
 * Uses `currentColor`, so set the text color (we use `text-seal`) on the
 * parent. Reused for the brand mark, loading, and empty states.
 */
export function JollySeal({
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
      {/* Stamp ring */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="2 4"
        opacity="0.7"
      />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" />
      {/* Skull */}
      <g fill="currentColor">
        <path d="M50 28c-11 0-19 7.8-19 18.5 0 5.6 2.4 9.7 5.6 12.4.9.8 1.4 1.5 1.5 2.7l.3 3.4c.1 1.3 1.2 2.3 2.5 2.3h18.2c1.3 0 2.4-1 2.5-2.3l.3-3.4c.1-1.2.6-1.9 1.5-2.7 3.2-2.7 5.6-6.8 5.6-12.4C69 35.8 61 28 50 28Zm-9.5 19a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Zm19 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2ZM50 52.5c1.4 0 2.4 1.3 2 2.6l-.9 3a1.2 1.2 0 0 1-2.3 0l-.9-3c-.4-1.3.6-2.6 2.1-2.6Z" />
        {/* Straw hat */}
        <path d="M28 31c2-5.5 11-9 22-9s20 3.5 22 9c.3.8-.5 1.5-1.3 1.2-6-2.3-13.2-3.4-20.7-3.4s-14.7 1.1-20.7 3.4c-.8.3-1.6-.4-1.3-1.2Z" />
        <rect x="35" y="29" width="30" height="3.4" rx="1.7" />
      </g>
      {/* Crossed bones */}
      <g
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      >
        <line x1="34" y1="70" x2="66" y2="82" />
        <line x1="66" y1="70" x2="34" y2="82" />
      </g>
    </svg>
  )
}
