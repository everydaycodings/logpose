import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAlbumEditData } from "@/lib/services/queries"
import { AlbumEditForm } from "./album-edit-form"

export const metadata: Metadata = { title: "Edit album" }

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getAlbumEditData(id)
  if (!data) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-heading text-5xl">Edit album</h1>
      <AlbumEditForm data={data} />
    </div>
  )
}
