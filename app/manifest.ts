import type { MetadataRoute } from "next"

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Jolly"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description: "A calm, personal music harbor.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3eee3",
    theme_color: "#f3eee3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
