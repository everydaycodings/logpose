import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPlaylistEditData } from "@/lib/services/queries"
import { PlaylistEditForm } from "./playlist-edit-form"

export const metadata: Metadata = { title: "Edit playlist" }

export default async function EditPlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPlaylistEditData(id)
  if (!data) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-heading text-5xl">Edit playlist</h1>
      <PlaylistEditForm data={data} />
    </div>
  )
}
