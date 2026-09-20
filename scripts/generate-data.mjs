// Generates digital-life CSV datasets into public/data.
// Each row: type,label,timestamp,value
// Patterns are intentionally embedded so the app can "discover" constellations.
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const OUT = join(process.cwd(), "public", "data")
mkdirSync(OUT, { recursive: true })

// Deterministic PRNG so the map is stable across reloads.
let seed = 42
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}
function pad(n) {
  return String(n).padStart(2, "0")
}
// Build an ISO timestamp for 2025.
function ts(month, day, hour, minute) {
  return `2025-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`
}

const rows = { music: [], movies: [], places: [], purchases: [], photos: [], messages: [], searches: [], events: [], notes: [] }
function add(type, label, month, day, hour, minute, value) {
  rows[type].push({ type, label, timestamp: ts(month, day, hour, minute), value })
}

const artists = ["Bon Iver", "Tame Impala", "Fleet Foxes", "SZA", "Radiohead", "Sufjan Stevens", "The National", "FKA twigs", "Khruangbin", "Beach House", "Phoebe Bridgers", "Four Tet"]
const films = ["Interstellar", "Arrival", "Her", "Blade Runner 2049", "Lost in Translation", "Portrait of a Lady on Fire", "Past Lives", "Everything Everywhere", "The Tree of Life", "Moonlight", "Drive", "La La Land"]
const cities = ["Kyoto", "Lisbon", "Reykjavik", "Marrakech", "Queenstown", "Oaxaca", "Hanoi", "Tromso", "Santorini", "Banff"]
const cafes = ["Blue Bottle", "Corner Cafe", "Riverside Roastery", "The Reading Room", "Maple & Oak"]
const goods = ["Vinyl record", "Film camera", "Hiking boots", "Ceramic mug", "Notebook", "Wool blanket", "Espresso beans", "Desk lamp", "Running shoes", "Houseplant"]
const people = ["Mom", "Alex", "Jordan", "Sam", "Priya", "Noah", "Mira", "Dad", "Leo", "Zoe"]
const queries = ["how to develop film at home", "best trails near Banff", "midnight ramen recipe", "northern lights forecast", "learn piano chords", "why do stars twinkle", "cheap flights to Lisbon", "how to press flowers", "meteor shower dates", "slow travel tips"]
const eventNames = ["Meteor shower watch", "Jazz night", "Farmers market", "Marathon", "Birthday dinner", "Gallery opening", "Camping trip", "Beach bonfire", "New Year countdown", "Open-air cinema"]
const noteTitles = ["Ideas for the year", "Things I'm grateful for", "Trip packing list", "Dream journal", "Recipe: miso soup", "Song lyrics draft", "Letter to future me", "Books to read", "Star names to remember", "Morning pages"]

// 1) Midnight Constellation: heavy late-night music + searches + notes (00:00-03:59)
for (let i = 0; i < 60; i++) {
  const month = 1 + Math.floor(rand() * 12)
  const day = 1 + Math.floor(rand() * 27)
  const hour = Math.floor(rand() * 4)
  const minute = Math.floor(rand() * 60)
  add("music", pick(artists), month, day, hour, minute, 1 + Math.floor(rand() * 5))
  if (rand() > 0.6) add("searches", pick(queries), month, day, hour, Math.floor(rand() * 60), 1)
  if (rand() > 0.75) add("notes", pick(noteTitles), month, day, hour, Math.floor(rand() * 60), 1)
}

// 2) Summer Nights: evening events, photos, music in Jun-Aug (18:00-23:59)
for (let i = 0; i < 45; i++) {
  const month = 6 + Math.floor(rand() * 3)
  const day = 1 + Math.floor(rand() * 27)
  const hour = 18 + Math.floor(rand() * 6)
  const minute = Math.floor(rand() * 60)
  add("events", pick(eventNames), month, day, hour, minute, 1 + Math.floor(rand() * 3))
  add("photos", "Summer evening", month, day, hour, Math.floor(rand() * 60), 1 + Math.floor(rand() * 8))
  if (rand() > 0.5) add("music", pick(artists), month, day, hour, Math.floor(rand() * 60), 1 + Math.floor(rand() * 4))
}

// 3) Travel Adventures: places + photos + purchases clustered in Apr, Sep
for (const month of [4, 9]) {
  const city = pick(cities)
  for (let d = 0; d < 12; d++) {
    const day = 8 + d
    add("places", city, month, day, 9 + Math.floor(rand() * 10), Math.floor(rand() * 60), 1 + Math.floor(rand() * 5))
    add("photos", `${city} trip`, month, day, 10 + Math.floor(rand() * 8), Math.floor(rand() * 60), 5 + Math.floor(rand() * 20))
    if (rand() > 0.6) add("purchases", pick(goods), month, day, 12 + Math.floor(rand() * 6), Math.floor(rand() * 60), 10 + Math.floor(rand() * 200))
    if (rand() > 0.7) add("searches", pick(queries), month, day, Math.floor(rand() * 24), Math.floor(rand() * 60), 1)
  }
}

// 4) Silver Screen: movie nights, mostly weekends/evenings year-round
for (let i = 0; i < 40; i++) {
  const month = 1 + Math.floor(rand() * 12)
  const day = 1 + Math.floor(rand() * 27)
  const hour = 19 + Math.floor(rand() * 4)
  add("movies", pick(films), month, day, hour, Math.floor(rand() * 60), 1 + Math.floor(rand() * 4))
}

// 5) Everyday orbit: cafes, messages, purchases, notes spread through the year
for (let i = 0; i < 120; i++) {
  const month = 1 + Math.floor(rand() * 12)
  const day = 1 + Math.floor(rand() * 27)
  const hour = 7 + Math.floor(rand() * 14)
  const minute = Math.floor(rand() * 60)
  const kind = rand()
  if (kind < 0.3) add("places", pick(cafes), month, day, hour, minute, 1 + Math.floor(rand() * 3))
  else if (kind < 0.6) add("messages", pick(people), month, day, hour, minute, 1 + Math.floor(rand() * 30))
  else if (kind < 0.8) add("purchases", pick(goods), month, day, hour, minute, 5 + Math.floor(rand() * 120))
  else add("notes", pick(noteTitles), month, day, hour, minute, 1)
}

// 6) A daily message heartbeat with a special someone (recurring evenings)
for (let month = 1; month <= 12; month++) {
  for (let d = 0; d < 6; d++) {
    const day = 3 + d * 4
    add("messages", "Alex", month, day, 20 + Math.floor(rand() * 3), Math.floor(rand() * 60), 15 + Math.floor(rand() * 60))
  }
}

const header = "type,label,timestamp,value\n"
function toCsv(list) {
  return header + list.map((r) => `${r.type},"${r.label}",${r.timestamp},${r.value}`).join("\n") + "\n"
}

let total = 0
for (const [type, list] of Object.entries(rows)) {
  list.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  writeFileSync(join(OUT, `${type}.csv`), toCsv(list))
  total += list.length
  console.log(`${type}.csv: ${list.length} rows`)
}
// Manifest so the app knows which datasets to load.
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(Object.keys(rows), null, 2))
console.log(`Total stars: ${total}`)
