// Client-safe metadata for smart playlists (no DB imports — used in the
// sidebar). The server-only loaders live in the smart page.
export type SmartKey =
  | "most-played"
  | "recently-added"
  | "recently-played"
  | "hidden-gems"

export const SMART_MIXES: Record<
  SmartKey,
  { title: string; blurb: string }
> = {
  "most-played": { title: "Most Played", blurb: "The songs you reach for most." },
  "recently-added": { title: "Recently Added", blurb: "Fresh aboard." },
  "recently-played": { title: "Recently Played", blurb: "Back on deck." },
  "hidden-gems": { title: "Hidden Gems", blurb: "Rarely played treasures." },
}

export const SMART_KEYS = Object.keys(SMART_MIXES) as SmartKey[]
