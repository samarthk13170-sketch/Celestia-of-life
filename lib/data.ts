import Papa from "papaparse"
import { STAR_TYPES, type Star, type StarType } from "./types"

interface RawRow {
  type: string
  label: string
  timestamp: string
  value: string
}

const TURNS = 2.4
const INNER_RADIUS = 140
const RADIUS_SPAN = 980

/** Deterministic hash -> 0..1, so a given star always lands in the same spot. */
function hash01(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0)
  const diff = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start
  return Math.floor(diff / 86400000)
}

/**
 * Places a star in a spiral-galaxy layout: time unwinds the spiral across the
 * year, while each activity type occupies its own arm. Constellation lines then
 * trace meaningful paths across the arms.
 */
function computePosition(type: StarType, dOfYear: number, seed: number) {
  const t = dOfYear / 366
  const armIndex = STAR_TYPES.indexOf(type)
  const armOffset = (armIndex / STAR_TYPES.length) * Math.PI * 2
  const jitterA = (seed - 0.5) * 0.35
  const jitterR = (hash01(String(seed)) - 0.5) * 90
  const angle = armOffset + t * TURNS * Math.PI * 2 + jitterA
  const radius = INNER_RADIUS + t * RADIUS_SPAN + jitterR
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

async function loadDataset(type: StarType): Promise<Star[]> {
  const res = await fetch(`/data/${type}.csv`)
  if (!res.ok) throw new Error(`Failed to load ${type}.csv`)
  const text = await res.text()
  const parsed = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true })
  const stars: Star[] = []
  parsed.data.forEach((row, i) => {
    if (!row.timestamp || !row.label) return
    const date = new Date(row.timestamp)
    if (Number.isNaN(date.getTime())) return
    const value = Number(row.value) || 1
    const id = `${type}-${i}`
    const seed = hash01(id + row.label + row.timestamp)
    const dOfYear = dayOfYear(date)
    const { x, y } = computePosition(type, dOfYear, seed)
    stars.push({
      id,
      type,
      label: row.label,
      timestamp: row.timestamp,
      value,
      date,
      hour: date.getHours(),
      month: date.getMonth() + 1,
      dayOfYear: dOfYear,
      x,
      y,
      magnitude: Math.min(1, 0.25 + Math.log1p(value) / 6),
      phase: seed * Math.PI * 2,
    })
  })
  return stars
}

/** Loads every dataset listed in the manifest and returns all stars. */
export async function loadAllStars(): Promise<Star[]> {
  const manifestRes = await fetch("/data/manifest.json")
  const types: StarType[] = manifestRes.ok ? await manifestRes.json() : STAR_TYPES
  const results = await Promise.all(types.map((t) => loadDataset(t)))
  return results.flat()
}
