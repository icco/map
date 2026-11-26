export function formatYears(place: { year: number | null; endYear?: number }) {
  if (place.year === null) return 'Year unknown';
  if (place.endYear && place.endYear !== place.year)
    return `${place.year} to ${place.endYear}`
  return String(place.year)
}
