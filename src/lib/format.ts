import type { Visit, Who } from "@/lib/places"

export const whoLabels: Record<Who, string> = {
  both: "Together",
  nat: "Nat",
  mel: "Mel",
}

export function formatVisit(visit: Pick<Visit, "year" | "endYear">) {
  if (visit.year === null) return "Year unknown"
  if (visit.endYear && visit.endYear !== visit.year)
    return `${visit.year} to ${visit.endYear}`
  return String(visit.year)
}

// Separate visits stay separate: a long history is counted, never shown as one stay.
export function formatYears(place: { visits: Visit[] }) {
  const labels = [...new Set(place.visits.map(formatVisit))]
  if (labels.length <= 3) return labels.join(", ")
  const years = place.visits.flatMap((visit) => visit.year ?? [])
  return `${labels.length} visits since ${Math.min(...years)}`
}
