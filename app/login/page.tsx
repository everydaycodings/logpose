import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { JollySeal } from "@/components/brand/jolly-seal"

export const metadata: Metadata = { title: "Come aboard" }

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Jolly"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-6">
        <JollySeal className="size-20 opacity-90" />
        <div className="text-center">
          <h1 className="font-heading text-5xl leading-none">{appName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your harbor for the music you love.
          </p>
        </div>
        <LoginForm from={from} />
      </div>
    </main>
  )
}
