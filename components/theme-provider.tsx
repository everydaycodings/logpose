"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Curated themes (see app/globals.css). "logbook" is the default off-white look.
export const THEMES = [
  { id: "logbook", label: "Logbook" },
  { id: "grandline", label: "Grand Line" },
  { id: "wanted", label: "Wanted Poster" },
  { id: "dark", label: "Below Deck" },
] as const

export type ThemeId = (typeof THEMES)[number]["id"]

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="logbook"
      enableSystem={false}
      themes={THEMES.map((t) => t.id)}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
