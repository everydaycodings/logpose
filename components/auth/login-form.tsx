"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm({ from }: { from?: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.replace(from && from.startsWith("/") ? from : "/")
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setError(data.error ?? "Something went wrong.")
    setLoading(false)
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
      <Input
        type="password"
        autoFocus
        autoComplete="current-password"
        placeholder="Crew password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="Password"
        className="h-11 text-center"
      />
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading || !password} className="h-11">
        {loading ? "Casting off…" : "Come aboard"}
      </Button>
    </form>
  )
}
