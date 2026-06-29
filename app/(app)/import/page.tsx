import type { Metadata } from "next"
import { ImportPanel } from "@/components/import/import-panel"

export const metadata: Metadata = { title: "Add music" }

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 font-heading text-5xl">Add music</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Bring songs aboard from a file or a YouTube link.
      </p>
      <ImportPanel />
    </div>
  )
}
