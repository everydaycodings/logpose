import { createWriteStream } from "node:fs"
import { readFile } from "node:fs/promises"
import { pipeline } from "node:stream/promises"
import { Readable } from "node:stream"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { env } from "@/lib/env"
import { putObject, s3 } from "@/lib/s3"

/** Download an object from S3/MinIO to a local file path. */
export async function downloadToFile(key: string, dest: string) {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
  )
  const body = res.Body as Readable
  await pipeline(body, createWriteStream(dest))
}

/** Upload a local file to S3/MinIO under `key`. */
export async function uploadFile(
  path: string,
  key: string,
  contentType: string,
) {
  const buf = await readFile(path)
  return putObject(key, buf, contentType)
}
