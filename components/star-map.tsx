"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { TYPE_META, type Constellation, type Star, type StarType } from "@/lib/types"

interface StarMapProps {
  stars: Star[]
  visibleTypes: Set<StarType>
  searchQuery: string
  selectedStarId: string | null
  highlightConstellations: Constellation[]
  onSelectStar: (star: Star | null) => void
}

interface View {
  scale: number
  x: number
  y: number
}

const MIN_SCALE = 0.15
const MAX_SCALE = 4

export function StarMap({
  stars,
  visibleTypes,
  searchQuery,
  selectedStarId,
  highlightConstellations,
  onSelectStar,
}: StarMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<View>({ scale: 0.5, x: 0, y: 0 })
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const [announce, setAnnounce] = useState("")
  const [focusIndex, setFocusIndex] = useState<number | null>(null)

  // Latest props kept in refs so the animation loop always reads fresh values.
  const propsRef = useRef({ stars, visibleTypes, searchQuery, selectedStarId, highlightConstellations })
  propsRef.current = { stars, visibleTypes, searchQuery, selectedStarId, highlightConstellations }
  const focusIndexRef = useRef<number | null>(null)
  focusIndexRef.current = focusIndex

  const backdropRef = useRef<{ x: number; y: number; r: number; a: number }[]>([])
  if (backdropRef.current.length === 0) {
    // Static distant starfield for depth, generated once.
    for (let i = 0; i < 220; i++) {
      backdropRef.current.push({
        x: (i * 9301 + 49297) % 233280 / 233280,
        y: (i * 49297 + 9301) % 233281 / 233281,
        r: ((i * 233) % 100) / 100,
        a: ((i * 71) % 100) / 100,
      })
    }
  }

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const { scale, x, y } = viewRef.current
    const { w, h } = sizeRef.current
    return { sx: wx * scale + x + w / 2, sy: wy * scale + y + h / 2 }
  }, [])

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const { scale, x, y } = viewRef.current
    const { w, h } = sizeRef.current
    return { wx: (sx - x - w / 2) / scale, wy: (sy - y - h / 2) / scale }
  }, [])

  const visibleStars = useCallback(() => {
    const { stars: s, visibleTypes: vt } = propsRef.current
    return s.filter((st) => vt.has(st.type))
  }, [])

  // Resize handling with devicePixelRatio for crisp rendering.
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      sizeRef.current = { w: rect.width, h: rect.height, dpr }
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  // Fit the whole galaxy in view once stars are loaded.
  useEffect(() => {
    if (stars.length === 0) return
    const maxR = Math.max(...stars.map((s) => Math.hypot(s.x, s.y)))
    const { w, h } = sizeRef.current
    const fit = Math.min(w, h) / (maxR * 2.2) || 0.4
    viewRef.current = { scale: Math.max(MIN_SCALE, Math.min(fit, MAX_SCALE)), x: 0, y: 0 }
  }, [stars])

  // Main render loop.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf = 0

    const render = (time: number) => {
      const { w, h, dpr } = sizeRef.current
      const { stars: allStars, visibleTypes: vt, searchQuery: q, selectedStarId: sel, highlightConstellations: hc } =
        propsRef.current
      const query = q.trim().toLowerCase()

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Deep-space background gradient.
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75)
      bg.addColorStop(0, "#0b1026")
      bg.addColorStop(0.5, "#070a1a")
      bg.addColorStop(1, "#03040d")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Distant static starfield.
      for (const s of backdropRef.current) {
        const twinkle = 0.3 + 0.3 * Math.sin(time * 0.001 + s.a * 10)
        ctx.globalAlpha = twinkle * (0.4 + s.r * 0.6)
        ctx.fillStyle = "#cbd5f5"
        ctx.fillRect(s.x * w, s.y * h, s.r * 1.4 + 0.3, s.r * 1.4 + 0.3)
      }
      ctx.globalAlpha = 1

      const highlightIds = new Set<string>()
      hc.forEach((c) => c.memberIds.forEach((id) => highlightIds.add(id)))

      // Constellation connection lines (pulsing).
      const byId = new Map(allStars.map((s) => [s.id, s]))
      for (const c of hc) {
        const pts = c.memberIds.map((id) => byId.get(id)).filter((s): s is Star => !!s && vt.has(s.type))
        if (pts.length < 2) continue
        const pulse = 0.35 + 0.35 * Math.sin(time * 0.003)
        ctx.strokeStyle = c.color
        ctx.lineWidth = 1
        ctx.globalAlpha = pulse
        ctx.beginPath()
        for (let i = 0; i < pts.length; i++) {
          const { sx, sy } = worldToScreen(pts[i].x, pts[i].y)
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        }
        ctx.stroke()
        // A glow traveling along the constellation path.
        const head = Math.floor((time * 0.02) % pts.length)
        const hp = worldToScreen(pts[head].x, pts[head].y)
        ctx.globalAlpha = 0.9
        ctx.fillStyle = c.color
        ctx.beginPath()
        ctx.arc(hp.sx, hp.sy, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Stars.
      const focusIdx = focusIndexRef.current
      const vis = allStars.filter((s) => vt.has(s.type))
      const focusStar = focusIdx != null ? vis[focusIdx] : null
      for (const s of allStars) {
        if (!vt.has(s.type)) continue
        const { sx, sy } = worldToScreen(s.x, s.y)
        if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue
        const meta = TYPE_META[s.type]
        const matches = query.length > 0 && s.label.toLowerCase().includes(query)
        const dimmed = query.length > 0 && !matches
        const isHighlight = highlightIds.has(s.id)
        const isSelected = s.id === sel
        const twinkle = 0.55 + 0.45 * Math.sin(time * 0.004 + s.phase)
        const baseR = 1.6 + s.magnitude * 3.4
        const r = baseR * (isSelected ? 2 : isHighlight ? 1.5 : 1)
        let alpha = twinkle
        if (dimmed) alpha *= 0.18
        if (hc.length > 0 && !isHighlight && !isSelected) alpha *= 0.35

        // Glow halo.
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4)
        glow.addColorStop(0, meta.color)
        glow.addColorStop(1, "transparent")
        ctx.globalAlpha = alpha * 0.5
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(sx, sy, r * 4, 0, Math.PI * 2)
        ctx.fill()

        // Star core.
        ctx.globalAlpha = Math.min(1, alpha + 0.2)
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(sx, sy, r * 0.7, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = alpha
        ctx.fillStyle = meta.color
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fill()

        if (matches) {
          ctx.globalAlpha = 0.9
          ctx.strokeStyle = "#fef08a"
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(sx, sy, r + 4, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1

      // Selected + keyboard-focused rings and labels.
      const drawMarker = (s: Star, color: string, label: boolean) => {
        const { sx, sy } = worldToScreen(s.x, s.y)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.9
        ctx.beginPath()
        ctx.arc(sx, sy, 12 + 2 * Math.sin(time * 0.006), 0, Math.PI * 2)
        ctx.stroke()
        if (label) {
          ctx.globalAlpha = 1
          ctx.font = "12px ui-sans-serif, system-ui, sans-serif"
          ctx.fillStyle = "#e5e7ff"
          const text = `${s.label}`
          const tw = ctx.measureText(text).width
          ctx.fillStyle = "rgba(3,4,13,0.8)"
          ctx.fillRect(sx + 14, sy - 20, tw + 12, 22)
          ctx.fillStyle = "#e5e7ff"
          ctx.fillText(text, sx + 20, sy - 5)
        }
      }
      if (focusStar && focusStar.id !== sel) drawMarker(focusStar, "#fef08a", true)
      const selStar = sel ? byId.get(sel) : null
      if (selStar && vt.has(selStar.type)) drawMarker(selStar, "#ffffff", true)
      ctx.globalAlpha = 1

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [worldToScreen])

  // Pointer: pan + click-to-select.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0

    const pickStar = (sx: number, sy: number): Star | null => {
      const { wx, wy } = screenToWorld(sx, sy)
      const { scale } = viewRef.current
      const threshold = 12 / scale
      let best: Star | null = null
      let bestD = threshold
      for (const s of visibleStars()) {
        const d = Math.hypot(s.x - wx, s.y - wy)
        if (d < bestD) {
          bestD = d
          best = s
        }
      }
      return best
    }

    const onDown = (e: PointerEvent) => {
      dragging = true
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true
      viewRef.current.x += dx
      viewRef.current.y += dy
      lastX = e.clientX
      lastY = e.clientY
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      if (!moved) {
        const rect = canvas.getBoundingClientRect()
        const star = pickStar(e.clientX - rect.left, e.clientY - rect.top)
        onSelectStar(star)
        if (star) {
          const idx = visibleStars().findIndex((s) => s.id === star.id)
          setFocusIndex(idx >= 0 ? idx : null)
        }
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const before = screenToWorld(px, py)
      const factor = Math.exp(-e.deltaY * 0.0015)
      const v = viewRef.current
      v.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor))
      const after = screenToWorld(px, py)
      v.x += (after.wx - before.wx) * v.scale
      v.y += (after.wy - before.wy) * v.scale
    }

    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("wheel", onWheel)
    }
  }, [onSelectStar, screenToWorld, visibleStars])

  // Keyboard navigation: arrows move between stars, +/- zoom, Enter selects.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const vis = visibleStars()
    if (vis.length === 0) return
    const centerView = (s: Star) => {
      const v = viewRef.current
      v.x = -s.x * v.scale
      v.y = -s.y * v.scale
    }
    if (e.key === "+" || e.key === "=") {
      viewRef.current.scale = Math.min(MAX_SCALE, viewRef.current.scale * 1.2)
      e.preventDefault()
      return
    }
    if (e.key === "-") {
      viewRef.current.scale = Math.max(MIN_SCALE, viewRef.current.scale / 1.2)
      e.preventDefault()
      return
    }
    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault()
      const cur = focusIndex != null ? vis[focusIndex] : null
      if (!cur) {
        setFocusIndex(0)
        centerView(vis[0])
        announceStar(vis[0])
        return
      }
      // Find nearest star in the pressed direction.
      let best: number | null = null
      let bestScore = Infinity
      vis.forEach((s, i) => {
        if (i === focusIndex) return
        const dx = s.x - cur.x
        const dy = s.y - cur.y
        const dirOk =
          (e.key === "ArrowRight" && dx > 0) ||
          (e.key === "ArrowLeft" && dx < 0) ||
          (e.key === "ArrowDown" && dy > 0) ||
          (e.key === "ArrowUp" && dy < 0)
        if (!dirOk) return
        const along = e.key === "ArrowRight" || e.key === "ArrowLeft" ? Math.abs(dx) : Math.abs(dy)
        const across = e.key === "ArrowRight" || e.key === "ArrowLeft" ? Math.abs(dy) : Math.abs(dx)
        const score = along + across * 2
        if (score < bestScore) {
          bestScore = score
          best = i
        }
      })
      if (best != null) {
        setFocusIndex(best)
        centerView(vis[best])
        announceStar(vis[best])
      }
      return
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (focusIndex != null) onSelectStar(vis[focusIndex])
      return
    }
    if (e.key === "Escape") {
      onSelectStar(null)
      setFocusIndex(null)
    }
  }

  const announceStar = (s: Star) => {
    setAnnounce(
      `${TYPE_META[s.type].label}: ${s.label}, ${s.date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
      })}. Press Enter to open.`,
    )
  }

  const zoomBy = (factor: number) => {
    viewRef.current.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewRef.current.scale * factor))
  }
  const resetView = () => {
    const maxR = Math.max(...stars.map((s) => Math.hypot(s.x, s.y)), 1)
    const { w, h } = sizeRef.current
    viewRef.current = {
      scale: Math.max(MIN_SCALE, Math.min(Math.min(w, h) / (maxR * 2.2), MAX_SCALE)),
      x: 0,
      y: 0,
    }
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-[#03040d]">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive star map of your digital life. Use arrow keys to move between stars, Enter to open a star, plus and minus to zoom."
        onKeyDown={onKeyDown}
        className="h-full w-full cursor-grab touch-none outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 active:cursor-grabbing"
      />
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom in"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-lg text-white/90 backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom out"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-lg text-white/90 backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Reset view"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-xs text-white/90 backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Fit
        </button>
      </div>
    </div>
  )
}
