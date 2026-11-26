import { geoEqualEarth, geoPath } from "d3-geo"
import type { FeatureCollection } from "geojson"
import { feature } from "topojson-client"
import type { GeometryCollection, Topology } from "topojson-specification"
import landTopology from "world-atlas/land-50m.json"

export const WIDTH = 1000

const projection = geoEqualEarth().fitWidth(WIDTH, { type: "Sphere" })
const path = geoPath(projection).digits(2)

export const HEIGHT = Math.ceil(path.bounds({ type: "Sphere" })[1][1])

export const spherePath = path({ type: "Sphere" }) ?? ""

export function landPath(): string {
  const topology = landTopology as unknown as Topology<{
    land: GeometryCollection
  }>
  const land = feature(topology, topology.objects.land) as FeatureCollection
  return path(land) ?? ""
}

export function project(coordinates: [number, number]): [number, number] {
  const point = projection(coordinates)
  if (!point) throw new Error(`Cannot project ${coordinates.join(", ")}`)
  return [Math.round(point[0] * 100) / 100, Math.round(point[1] * 100) / 100]
}
