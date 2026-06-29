import "dotenv/config"
import path from "node:path"
import { defineConfig } from "prisma/config"

// Prisma 7 no longer auto-loads .env, so we import dotenv above.
// The connection URL also moved out of schema.prisma into here for migrations.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
