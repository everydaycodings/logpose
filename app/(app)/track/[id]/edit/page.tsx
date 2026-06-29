import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getEditPickers, getTrackEditData } from "@/lib/services/queries"
import { EditForm } from "./edit-form"

export const metadata: Metadata = { title: "Edit track" }

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [data, pickers] = await Promise.all([
    getTrackEditData(id),
    getEditPickers(),
  ])
  if (!data) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-heading text-5xl">Edit details</h1>
      <EditForm
        data={data}
        artistNames={pickers.artistNames}
        albumTitles={pickers.albumTitles}
      />
    </div>
  )
}
