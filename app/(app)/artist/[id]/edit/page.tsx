import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getArtistEditData } from "@/lib/services/queries"
import { ArtistEditForm } from "./artist-edit-form"

export const metadata: Metadata = { title: "Edit artist" }

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getArtistEditData(id)
  if (!data) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-heading text-5xl">Edit artist</h1>
      <ArtistEditForm data={data} />
    </div>
  )
}
