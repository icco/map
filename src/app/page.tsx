import type { Metadata } from "next"

import { PlaceMap } from "@/components/PlaceMap"
import { getPlaces } from "@/lib/places"
import { site } from "@/lib/site"
import { HEIGHT, project, spherePath, WIDTH } from "@/lib/world"

export const metadata: Metadata = { alternates: { canonical: "/" } }

export default function Home() {
  const places = getPlaces().map(({ coordinates, ...place }) => {
    const [x, y] = project(coordinates)
    return { ...place, x, y }
  })

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8">
      <h1 className="text-[32px] leading-tight font-normal">{site.name}</h1>
      <p className="mt-2 mb-6 text-base-content/70">{site.description}</p>
      <PlaceMap
        places={places}
        width={WIDTH}
        height={HEIGHT}
        spherePath={spherePath}
      />
    </div>
  )
}
