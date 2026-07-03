/** Normalize a name into a stable key for dedup/upsert. */
export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    // Fold underscores, hyphens, apostrophes and any other punctuation/symbols
    // to spaces so "Guns N' Roses" == "guns-n-roses" == "Guns_N_Roses".
    // Unicode-aware: non-Latin letters/numbers (e.g. 宇多田, Кино) are kept.
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function albumSlug(artist: string, title: string): string {
  return `${normalizeKey(artist)}::${normalizeKey(title)}`
}
