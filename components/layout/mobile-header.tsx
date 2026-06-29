"use client"

import { GearSix } from "@phosphor-icons/react"
import Link from "next/link"
import { LogPoseSeal } from "@/components/brand/logpose-seal"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "LogPose"

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <LogPoseSeal className="size-7" />
        <span className="font-heading text-2xl leading-none">{appName}</span>
      </Link>
      <div className="flex items-center gap-1">
        <ThemeSwitcher />
        <Link
          href="/settings"
          aria-label="Settings"
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <GearSix className="size-5" />
        </Link>
      </div>
    </header>
  )
}
