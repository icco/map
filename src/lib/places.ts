import { readFileSync } from "node:fs"
import path from "node:path"

import { z } from "zod"

const feature = z.object({
  type: z.literal("Feature"),
  id: z.string().regex(/^[a-z0-9-]+$/),
  properties: z.object({
    city: z.string().min(1),
    kind: z.enum(["lived", "visited"]),
    year: z.number().int().nullable(),
    endYear: z.number().int().optional(),
    photo: z.string().startsWith("/photos/"),
    photoCredit: z.string().min(1).optional(),
    photoSource: z.url().optional(),
    description: z.string().min(1),
  }),
  geometry: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }),
})

const collection = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(feature).min(1),
})

export type Place = z.infer<typeof feature>["properties"] & {
  id: string
  coordinates: [number, number]
}

let cached: Place[] | undefined

export function getPlaces(): Place[] {
  if (cached) return cached
  const file = path.join(process.cwd(), "public", "places.geojson")
  const { features } = collection.parse(JSON.parse(readFileSync(file, "utf8")))
  const ids = new Set(features.map((f) => f.id))
  if (ids.size !== features.length)
    throw new Error("places.geojson has duplicate feature ids")
  cached = features.map((f) => ({
    ...f.properties,
    id: f.id,
    coordinates: f.geometry.coordinates,
  }))
  return cached
}
