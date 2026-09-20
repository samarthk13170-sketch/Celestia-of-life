"use client"

import { TYPE_META, type Constellation, type Star } from "@/lib/types"

interface SidebarProps {
  constellations: Constellation[]
  totalStars: number
  selectedStar: Star | null
  starConstellations: Constellation[]
  activeConstellationId: string | null
  onSelectConstellation: (id: string | null) => void
  onClearSelection: () => void
}

export function Sidebar({
  constellations,
  totalStars,
  selectedStar,
  starConstellations,
  activeConstellationId,
  onSelectConstellation,
  onClearSelection,
}: SidebarProps) {
  return (
    <aside
      aria-label="Narrative insights"
      className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-[#070a1a]/80 p-5 text-slate-200"
    >
      <header>
        <h1 className="text-balance text-xl font-semibold tracking-tight text-white">Constellations of Life</h1>
        <p className="mt-1 text-sm text-slate-400">
          {totalStars} receipts became stars. Connect them to uncover the chapters of a year.
        </p>
      </header>

      {selectedStar ? (
        <StarDetail star={selectedStar} chapters={starConstellations} onBack={onClearSelection} />
      ) : (
        <section aria-labelledby="chapters-heading" className="flex flex-col gap-3">
          <h2 id="chapters-heading" className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Chapters
          </h2>
          <ul className="flex flex-col gap-2">
            {constellations.map((c) => {
              const active = c.id === activeConstellationId
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectConstellation(active ? null : c.id)}
                    className={`w-full rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                      active
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}` }}
                      />
                      <span className="font-medium text-white">{c.name}</span>
                      {c.recurring && (
                        <span className="ml-auto rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">
                          Recurring
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs italic text-slate-400">{c.chapter}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{c.story}</p>
                    <p className="mt-2 text-xs text-slate-500">{c.memberIds.length} stars</p>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </aside>
  )
}

function StarDetail({
  star,
  chapters,
  onBack,
}: {
  star: Star
  chapters: Constellation[]
  onBack: () => void
}) {
  const meta = TYPE_META[star.type]
  return (
    <section aria-labelledby="star-heading" className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-md px-2 py-1 text-xs text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        ← Back to chapters
      </button>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: meta.color, boxShadow: `0 0 10px ${meta.color}` }}
          />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <h2 id="star-heading" className="mt-2 text-balance text-lg font-semibold text-white">
          {star.label}
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-slate-500">When</dt>
            <dd className="text-slate-200">
              {star.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Time</dt>
            <dd className="text-slate-200">
              {star.date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Intensity</dt>
            <dd className="text-slate-200">{star.value}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Part of {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"}
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {chapters.map((c) => (
            <li key={c.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}` }}
                />
                <span className="font-medium text-white">{c.name}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{c.story}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Related stars in these chapters are now glowing on the map — pan around to connect the dots.
        </p>
      </div>
    </section>
  )
}
