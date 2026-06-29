import type { Metadata, Viewport } from "next"
import { Caveat, Hanken_Grotesk, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Body / UI — a humanist grotesque, deliberately not the default Inter.
const fontSans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

// Display / headings — handwritten, used with restraint (logo, titles).
const fontHeading = Caveat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
})

// Utility — timecodes and data.
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Jolly"

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: "A calm, personal music harbor.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: appName, statusBarStyle: "default" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#f3eee3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontHeading.variable,
        fontMono.variable,
      )}
    >
      <body className="font-sans">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
