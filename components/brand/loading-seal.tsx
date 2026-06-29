import { LogPoseSeal } from "@/components/brand/logpose-seal"

/** Den Den Mushi "ringing" loader — a pulsing LogPose seal with ripple rings. */
export function LoadingSeal({ label = "Setting sail…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5">
      <div className="relative">
        <span className="absolute inset-0 animate-ping rounded-full bg-seal/20" />
        <span className="absolute -inset-3 animate-ping rounded-full bg-seal/10 [animation-delay:200ms]" />
        <LogPoseSeal className="relative size-16 animate-pulse" />
      </div>
      <p className="font-heading text-2xl text-muted-foreground">{label}</p>
    </div>
  )
}
