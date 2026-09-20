export type StarType =
  | "music"
  | "movies"
  | "places"
  | "purchases"
  | "photos"
  | "messages"
  | "searches"
  | "events"
  | "notes"

/** A single digital-life receipt, mapped to a star in the sky. */
export interface Star {
  id: string
  type: StarType
  label: string
  /** Raw ISO timestamp string from the dataset. */
  timestamp: string
  /** Numeric weight (plays, spend, photo count, message count...). */
  value: number
  // Derived fields, computed at load time.
  date: Date
  hour: number
  month: number
  dayOfYear: number
  /** Virtual-space coordinates (centered at origin). */
  x: number
  y: number
  /** Visual size seed, 0..1, derived from value. */
  magnitude: number
  /** Twinkle phase offset so stars shimmer out of sync. */
  phase: number
}

export interface Constellation {
  id: string
  name: string
  /** Short chapter subtitle. */
  chapter: string
  color: string
  /** IDs of member stars, in chronological order. */
  memberIds: string[]
  /** Human-readable narrative insight. */
  story: string
  /** Whether this chapter is a recurring pattern. */
  recurring: boolean
}

export const STAR_TYPES: StarType[] = [
  "music",
  "movies",
  "places",
  "purchases",
  "photos",
  "messages",
  "searches",
  "events",
  "notes",
]

/** Accessible, distinct colors for each activity type. */
export const TYPE_META: Record<StarType, { color: string; label: string }> = {
  music: { color: "#a78bfa", label: "Music" },
  movies: { color: "#38bdf8", label: "Movies" },
  places: { color: "#34d399", label: "Places" },
  purchases: { color: "#fbbf24", label: "Purchases" },
  photos: { color: "#f472b6", label: "Photos" },
  messages: { color: "#60a5fa", label: "Messages" },
  searches: { color: "#2dd4bf", label: "Searches" },
  events: { color: "#fb923c", label: "Events" },
  notes: { color: "#c4b5fd", label: "Notes" },
}
