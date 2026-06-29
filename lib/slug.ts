/** Normalize a name into a stable key for dedup/upsert. */
export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/\s+/g, " ")
    .trim()
}

export function albumSlug(artist: string, title: string): string {
  return `${normalizeKey(artist)}::${normalizeKey(title)}`
}
