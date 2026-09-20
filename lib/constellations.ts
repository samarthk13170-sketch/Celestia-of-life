import type { Constellation, Star } from "./types"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface PatternDef {
  id: string
  name: string
  chapter: string
  color: string
  recurring: boolean
  match: (s: Star) => boolean
}

/**
 * Each pattern is a "chapter" of life. A star can belong to several chapters,
 * so constellations overlap the way real memories do.
 */
const PATTERNS: PatternDef[] = [
  {
    id: "midnight",
    name: "Midnight Constellation",
    chapter: "The hours the world forgot",
    color: "#a78bfa",
    recurring: true,
    match: (s) => s.hour >= 0 && s.hour < 4,
  },
  {
    id: "summer-nights",
    name: "Summer Nights",
    chapter: "Long evenings, warm air",
    color: "#fb923c",
    recurring: false,
    match: (s) => s.month >= 6 && s.month <= 8 && s.hour >= 18,
  },
  {
    id: "travel",
    name: "Travel Adventures",
    chapter: "Roads that led somewhere new",
    color: "#34d399",
    recurring: false,
    match: (s) =>
      (s.type === "places" || s.type === "photos") &&
      (s.month === 4 || s.month === 9 || /trip/i.test(s.label)),
  },
  {
    id: "silver-screen",
    name: "Silver Screen",
    chapter: "Stories told in the dark",
    color: "#38bdf8",
    recurring: false,
    match: (s) => s.type === "movies",
  },
  {
    id: "sound-waves",
    name: "Sound Waves",
    chapter: "The soundtrack of a year",
    color: "#c4b5fd",
    recurring: false,
    match: (s) => s.type === "music",
  },
  {
    id: "kindred",
    name: "Kindred Threads",
    chapter: "The people who stayed close",
    color: "#60a5fa",
    recurring: true,
    match: (s) => s.type === "messages",
  },
  {
    id: "everyday-orbit",
    name: "Everyday Orbit",
    chapter: "The small, steady rituals",
    color: "#fbbf24",
    recurring: false,
    match: (s) =>
      (s.type === "purchases" || s.type === "notes") ||
      (s.type === "places" && !/trip/i.test(s.label) && s.month !== 4 && s.month !== 9),
  },
]

function peakHour(stars: Star[]): number {
  const buckets = new Array(24).fill(0)
  stars.forEach((s) => (buckets[s.hour] += 1))
  return buckets.indexOf(Math.max(...buckets))
}

function topLabel(stars: Star[]): { label: string; count: number } {
  const counts = new Map<string, number>()
  stars.forEach((s) => counts.set(s.label, (counts.get(s.label) || 0) + 1))
  let best = { label: "", count: 0 }
  counts.forEach((count, label) => {
    if (count > best.count) best = { label, count }
  })
  return best
}

function monthSpan(stars: Star[]): string {
  const months = [...new Set(stars.map((s) => s.month))].sort((a, b) => a - b)
  if (months.length === 0) return ""
  if (months.length === 1) return MONTHS[months[0] - 1]
  return `${MONTHS[months[0] - 1]}–${MONTHS[months[months.length - 1] - 1]}`
}

function buildStory(def: PatternDef, members: Star[]): string {
  const top = topLabel(members)
  const span = monthSpan(members)
  const hour = peakHour(members)
  const hourLabel = `${((hour + 11) % 12) + 1}${hour < 12 ? "am" : "pm"}`
  switch (def.id) {
    case "midnight":
      return `${members.length} moments after midnight, peaking around ${hourLabel}. "${top.label}" kept you company most while the rest of the world slept.`
    case "summer-nights":
      return `${members.length} warm-weather nights across ${span}. The evenings stretched out with "${top.label}" leading the way.`
    case "travel":
      return `${members.length} waypoints from your journeys in ${span}. "${top.label}" appears most — a place that clearly left a mark.`
    case "silver-screen":
      return `${members.length} films watched, usually near ${hourLabel}. "${top.label}" was on rotation more than once.`
    case "sound-waves":
      return `${members.length} listens shaping the year's soundtrack. "${top.label}" was the artist you returned to again and again.`
    case "kindred":
      return `${members.length} conversations, most active around ${hourLabel}. "${top.label}" was the name that lit up your sky the most.`
    default:
      return `${members.length} small rituals across ${span} — the quiet, steady orbit of ordinary days. "${top.label}" recurred the most.`
  }
}

/** Builds all constellations from the loaded stars. */
export function buildConstellations(stars: Star[]): Constellation[] {
  return PATTERNS.map((def) => {
    const members = stars
      .filter(def.match)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    return {
      id: def.id,
      name: def.name,
      chapter: def.chapter,
      color: def.color,
      recurring: def.recurring,
      memberIds: members.map((s) => s.id),
      story: members.length ? buildStory(def, members) : "No stars in this chapter yet.",
    }
  }).filter((c) => c.memberIds.length > 0)
}

/** Returns the constellations a given star belongs to. */
export function constellationsForStar(starId: string, constellations: Constellation[]): Constellation[] {
  return constellations.filter((c) => c.memberIds.includes(starId))
}
