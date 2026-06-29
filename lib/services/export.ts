import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { s3 } from "@/lib/s3"

/** List every object key (paginated) in the bucket, with sizes. */
export async function listAllObjects(): Promise<
  { key: string; size: number }[]
> {
  const out: { key: string; size: number }[] = []
  let token: string | undefined
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET,
        ContinuationToken: token,
      }),
    )
    for (const o of res.Contents ?? []) {
      if (o.Key) out.push({ key: o.Key, size: o.Size ?? 0 })
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return out
}

export async function getLibraryStats() {
  const [tracks, albums, artists, playlists, objects] = await Promise.all([
    db.track.count(),
    db.album.count(),
    db.artist.count(),
    db.playlist.count(),
    listAllObjects(),
  ])
  const totalBytes = objects.reduce((sum, o) => sum + o.size, 0)
  return {
    tracks,
    albums,
    artists,
    playlists,
    assetCount: objects.length,
    totalBytes,
  }
}

/** Full database snapshot — every row from every model. */
export async function dumpDatabase() {
  const [artists, albums, tracks, playlists, playlistTracks] =
    await Promise.all([
      db.artist.findMany(),
      db.album.findMany(),
      db.track.findMany(),
      db.playlist.findMany(),
      db.playlistTrack.findMany(),
    ])
  return {
    exportedAt: new Date().toISOString(),
    app: "jolly",
    version: 1,
    counts: {
      artists: artists.length,
      albums: albums.length,
      tracks: tracks.length,
      playlists: playlists.length,
    },
    data: { artists, albums, tracks, playlists, playlistTracks },
  }
}
