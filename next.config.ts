import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Build a self-contained server bundle for the Docker image.
  output: "standalone",
  // Keep Prisma out of the bundler so its engine is traced correctly.
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    // Audio uploads can be large.
    serverActions: { bodySizeLimit: "100mb" },
  },
}

export default nextConfig
