import type { Metadata } from "next"

import { PlaceMap } from "@/components/PlaceMap"
import { getPlaces } from "@/lib/places"
import { site } from "@/lib/site"
import { graticulePath, HEIGHT, project, spherePath, WIDTH } from "@/lib/world"

export const metadata: Metadata = { alternates: { canonical: "/" } }

export default function Home() {
  const places = getPlaces().map(({ coordinates, ...place }) => {
    const [x, y] = project(coordinates)
    return { ...place, x, y }
  })

  return (
    <PlaceMap
      title={site.name}
      places={places}
      width={WIDTH}
      height={HEIGHT}
      spherePath={spherePath}
      graticulePath={graticulePath}
    />
  )
}
