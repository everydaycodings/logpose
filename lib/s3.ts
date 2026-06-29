import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "./env"

/**
 * S3-compatible object storage client (MinIO by default).
 * Path-style addressing is required for MinIO.
 */
export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
})

const BUCKET = env.S3_BUCKET

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
  return key
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/**
 * Presigned GET URL. Honors HTTP range requests, so audio seeking works
 * natively in the browser. Rewrites the host to the public URL when the
 * internal endpoint (e.g. `minio:9000`) isn't reachable by the client.
 */
export async function presignGet(key: string, expiresIn = 60 * 60) {
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn },
  )
  if (env.S3_PUBLIC_URL) {
    const internal = new URL(env.S3_ENDPOINT)
    const publicUrl = new URL(env.S3_PUBLIC_URL)
    return url.replace(internal.origin, publicUrl.origin)
  }
  return url
}
