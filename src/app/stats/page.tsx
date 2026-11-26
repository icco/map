import type { Metadata } from "next"

import { getPlaces } from "@/lib/places"
import { countryStats } from "@/lib/stats"

export const metadata: Metadata = {
  title: "Stats",
  description: "How many countries and cities Nat and Mel have been to.",
  alternates: { canonical: "/stats" },
}

export default function Stats() {
  const places = getPlaces()
  const countries = countryStats(places)
  const totals = [
    { key: "countries", label: "Countries", value: countries.length },
    { key: "cities", label: "Cities", value: places.length },
    {
      key: "lived",
      label: "Lived in",
      value: places.filter((place) => place.kind === "lived").length,
    },
    {
      key: "visited",
      label: "Visited",
      value: places.filter((place) => place.kind === "visited").length,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8">
      <h1 className="text-[32px] leading-tight font-normal">Stats</h1>
      <p className="mt-2 mb-6 text-base-content/70">
        Nat and Mel have been to {countries.length}{" "}
        {countries.length === 1 ? "country" : "countries"}.
      </p>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {totals.map(({ key, label, value }) => (
          <div
            key={key}
            className="flex flex-col-reverse rounded-box border border-base-300 bg-base-200 p-4"
          >
            <dt className="text-sm text-base-content/70">{label}</dt>
            <dd data-stat={key} className="text-4xl font-semibold">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 mb-2 text-lg font-semibold">By country</h2>
      <ul>
        {countries.map(({ country, cities }) => (
          <li
            key={country}
            data-country={country}
            className="border-b border-base-200 py-3"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-semibold">{country}</span>
              <span className="shrink-0 text-sm text-base-content/60">
                {cities.length} {cities.length === 1 ? "city" : "cities"}
              </span>
            </div>
            <p className="text-sm text-base-content/70">{cities.join(" · ")}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
