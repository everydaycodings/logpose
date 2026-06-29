import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow the dev server to be reached from this LAN address (e.g. a phone).
  allowedDevOrigins: ["192.168.29.71"],
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
