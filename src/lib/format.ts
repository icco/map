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

export function formatYears(place: { visits: Visit[] }) {
  const years = place.visits.flatMap((visit) =>
    visit.year === null ? [] : [visit.year, visit.endYear ?? visit.year]
  )
  if (!years.length) return "Year unknown"
  return formatVisit({
    year: Math.min(...years),
    endYear: Math.max(...years),
  })
}
