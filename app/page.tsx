"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Controls } from "@/components/controls"
import { Sidebar } from "@/components/sidebar"
import { StarMap } from "@/components/star-map"
import { buildConstellations, constellationsForStar } from "@/lib/constellations"
import { loadAllStars } from "@/lib/data"
import { STAR_TYPES, type Star, type StarType } from "@/lib/types"

export default function Page() {
  const { data: stars, isLoading, error } = useSWR("all-stars", loadAllStars, {
    revalidateOnFocus: false,
  })

  const [visibleTypes, setVisibleTypes] = useState<Set<StarType>>(new Set(STAR_TYPES))
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStar, setSelectedStar] = useState<Star | null>(null)
  const [activeConstellationId, setActiveConstellationId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const constellations = useMemo(() => (stars ? buildConstellations(stars) : []), [stars])

  const starConstellations = useMemo(
    () => (selectedStar ? constellationsForStar(selectedStar.id, constellations) : []),
    [selectedStar, constellations],
  )

  const highlightConstellations = useMemo(() => {
    if (selectedStar) return starConstellations
    if (activeConstellationId) {
      const c = constellations.find((x) => x.id === activeConstellationId)
      return c ? [c] : []
    }
    return []
  }, [selectedStar, starConstellations, activeConstellationId, constellations])

  const toggleType = (type: StarType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const handleSelectStar = (star: Star | null) => {
    setSelectedStar(star)
    setActiveConstellationId(null)
    if (star) setDrawerOpen(true)
  }

  const handleSelectConstellation = (id: string | null) => {
    setActiveConstellationId(id)
    setSelectedStar(null)
  }

  return (
    <main className="flex h-dvh flex-col bg-[#03040d] text-white">
      <header className="z-30 border-b border-white/10 bg-[#070a1a]/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label={drawerOpen ? "Hide insights panel" : "Show insights panel"}
            aria-expanded={drawerOpen}
            className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/90 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 lg:hidden"
          >
            Insights
          </button>
          <div className="min-w-0 flex-1">
            <Controls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              visibleTypes={visibleTypes}
              onToggleType={toggleType}
              onToggleAll={(all) => setVisibleTypes(all ? new Set(STAR_TYPES) : new Set())}
            />
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar: static column on desktop, slide-in drawer on mobile. */}
        <div
          className={`absolute inset-y-0 left-0 z-20 w-[86%] max-w-sm transform border-r border-white/10 transition-transform duration-300 ease-out lg:static lg:block lg:w-[380px] lg:translate-x-0 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center bg-[#070a1a]/80 p-6 text-sm text-slate-400">
              Charting your galaxy…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center bg-[#070a1a]/80 p-6 text-sm text-red-300">
              Could not load datasets.
            </div>
          ) : (
            <Sidebar
              constellations={constellations}
              totalStars={stars?.length ?? 0}
              selectedStar={selectedStar}
              starConstellations={starConstellations}
              activeConstellationId={activeConstellationId}
              onSelectConstellation={handleSelectConstellation}
              onClearSelection={() => handleSelectStar(null)}
            />
          )}
        </div>

        {/* Mobile backdrop */}
        {drawerOpen && (
          <button
            type="button"
            aria-label="Close insights panel"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 z-10 bg-black/50 lg:hidden"
          />
        )}

        <div className="relative min-h-0 flex-1">
          {stars && stars.length > 0 && (
            <StarMap
              stars={stars}
              visibleTypes={visibleTypes}
              searchQuery={searchQuery}
              selectedStarId={selectedStar?.id ?? null}
              highlightConstellations={highlightConstellations}
              onSelectStar={handleSelectStar}
            />
          )}
          {isLoading && (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Charting your galaxy…
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
