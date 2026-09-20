"use client"

import { STAR_TYPES, TYPE_META, type StarType } from "@/lib/types"

interface ControlsProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  visibleTypes: Set<StarType>
  onToggleType: (type: StarType) => void
  onToggleAll: (all: boolean) => void
}

export function Controls({
  searchQuery,
  onSearchChange,
  visibleTypes,
  onToggleType,
  onToggleAll,
}: ControlsProps) {
  const allOn = visibleTypes.size === STAR_TYPES.length
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label htmlFor="star-search" className="sr-only">
          Search stars by name
        </label>
        <input
          id="star-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search stars — artists, places, people…"
          className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:border-amber-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter star types">
        <button
          type="button"
          aria-pressed={allOn}
          onClick={() => onToggleAll(!allOn)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
            allOn ? "border-white/50 bg-white/15 text-white" : "border-white/15 bg-white/[0.03] text-slate-300 hover:bg-white/10"
          }`}
        >
          {allOn ? "All types" : "Show all"}
        </button>
        {STAR_TYPES.map((type) => {
          const on = visibleTypes.has(type)
          const meta = TYPE_META[type]
          return (
            <button
              key={type}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleType(type)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                on ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-transparent text-slate-500 hover:bg-white/5"
              }`}
            >
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? meta.color : "#475569", boxShadow: on ? `0 0 6px ${meta.color}` : "none" }}
              />
              {meta.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
