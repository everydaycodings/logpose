"use client"

import { Heart, House, MagnifyingGlass, UploadSimple } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/search", label: "Search", icon: MagnifyingGlass },
  { href: "/liked", label: "Liked", icon: Heart },
  { href: "/import", label: "Add", icon: UploadSimple },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="flex shrink-0 items-stretch justify-around border-t border-border bg-card md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
              active ? "text-seal" : "text-muted-foreground",
            )}
          >
            <Icon weight={active ? "fill" : "regular"} className="size-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
