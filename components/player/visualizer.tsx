"use client"

import { useEffect, useRef } from "react"
import { audioGraph } from "@/lib/player/audio-graph"
import { cn } from "@/lib/utils"

/**
 * Frequency-bar visualizer reading the shared AnalyserNode. Falls back to a
 * calm idle state when nothing is playing. Respects prefers-reduced-motion.
 */
export function Visualizer({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    const data = new Uint8Array(128)

    function resize() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    function draw() {
      if (!canvas || !ctx) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      const analyser = audioGraph.analyser
      const accent = getComputedStyle(canvas).color
      ctx.fillStyle = accent

      const bars = 48
      const gap = 2
      const bw = (w - gap * (bars - 1)) / bars

      if (analyser && !reduce) {
        analyser.getByteFrequencyData(data)
        for (let i = 0; i < bars; i++) {
          const v = data[Math.floor((i / bars) * data.length)] ?? 0
          const bh = Math.max(2, (v / 255) * h)
          ctx.globalAlpha = 0.35 + (v / 255) * 0.65
          roundedBar(ctx, i * (bw + gap), h - bh, bw, bh)
        }
      } else {
        // Idle: a gentle flat line of dots.
        ctx.globalAlpha = 0.25
        for (let i = 0; i < bars; i++) {
          roundedBar(ctx, i * (bw + gap), h - 2, bw, 2)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("text-seal", className)}
    />
  )
}

function roundedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const r = Math.min(w / 2, 3)
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}
