import { z } from "zod"

/**
 * Server-side environment validation.
 *
 * Parsed once at module load so a misconfigured deployment fails loudly
 * instead of erroring deep inside a request. During `next build` we may not
 * have real secrets available, so `SKIP_ENV_VALIDATION=1` bypasses the checks.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.url().default("redis://localhost:6379"),

  // Object storage (MinIO / any S3-compatible).
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("music"),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  // MinIO requires path-style addressing.
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // Public base URL clients use to reach object storage (presigned URLs).
  S3_PUBLIC_URL: z.url().optional(),

  // Single-password gate.
  APP_PASSWORD: z.string().min(1),
  COOKIE_SECRET: z.string().min(16),

  // Rate limiting (tunable).
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().default(5),
  RATE_LIMIT_LOGIN_WINDOW_S: z.coerce.number().default(900),
  RATE_LIMIT_IMPORT_MAX: z.coerce.number().default(10),
  RATE_LIMIT_IMPORT_WINDOW_S: z.coerce.number().default(60),

  // MusicBrainz requires a descriptive User-Agent.
  MUSICBRAINZ_USER_AGENT: z
    .string()
    .default("Jolly/0.1 (personal-music-app)"),

  // Last.fm scrobbling (optional — dormant unless both are set).
  LASTFM_API_KEY: z.string().optional(),
  LASTFM_API_SECRET: z.string().optional(),
})

function loadEnv() {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return process.env as unknown as z.infer<typeof schema>
  }
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    throw new Error(`Invalid environment variables:\n${issues}`)
  }
  return parsed.data
}

export const env = loadEnv()
