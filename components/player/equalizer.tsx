"use client"

import { Sliders } from "@phosphor-icons/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { EQ_BANDS, EQ_PRESETS, usePlayer } from "@/store/player"

function bandLabel(hz: number) {
  return hz >= 1000 ? `${hz / 1000}k` : `${hz}`
}

export function Equalizer() {
  const eq = usePlayer((s) => s.eq)
  const eqEnabled = usePlayer((s) => s.eqEnabled)
  const setEqBand = usePlayer((s) => s.setEqBand)
  const setEqPreset = usePlayer((s) => s.setEqPreset)
  const toggleEq = usePlayer((s) => s.toggleEq)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Equalizer"
          className={cn(
            "rounded-full px-3 py-1.5 text-sm hover:bg-accent",
            eqEnabled ? "text-seal" : "text-muted-foreground",
          )}
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="size-4" /> EQ
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-heading text-2xl">
            Equalizer
            <button
              type="button"
              onClick={toggleEq}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                eqEnabled
                  ? "bg-seal text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {eqEnabled ? "On" : "Off"}
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-end justify-between gap-2 px-2 pt-2">
          {EQ_BANDS.map((hz, i) => (
            <div key={hz} className="flex flex-col items-center gap-2">
              <div className="text-[10px] tabular-nums text-muted-foreground">
                {eq[i]! > 0 ? "+" : ""}
                {eq[i]}
              </div>
              <Slider
                orientation="vertical"
                value={[eq[i] ?? 0]}
                min={-12}
                max={12}
                step={1}
                onValueChange={([v]) => setEqBand(i, v ?? 0)}
                aria-label={`${bandLabel(hz)} Hz`}
                className="h-32"
              />
              <div className="text-[10px] text-muted-foreground">{bandLabel(hz)}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(EQ_PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setEqPreset(name)}
              className="rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
            >
              {name}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
