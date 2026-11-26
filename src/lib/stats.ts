import type { Place } from "@/lib/places"

export type CountryStat = { country: string; cities: string[] }

export function countryStats(places: Place[]): CountryStat[] {
  const byCountry = new Map<string, string[]>()
  for (const place of places) {
    const cities = byCountry.get(place.country) ?? []
    cities.push(place.city)
    byCountry.set(place.country, cities)
  }
  return [...byCountry]
    .map(([country, cities]) => ({ country, cities }))
    .sort(
      (a, b) =>
        b.cities.length - a.cities.length || a.country.localeCompare(b.country)
    )
}
