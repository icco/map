# map.natwelch.com

A map of the cities Nat and Mel have lived in and visited, at <https://map.natwelch.com>.

## Run it

```sh
nvm use
npm install --global pnpm@11.2.2
export NODE_AUTH_TOKEN="$(gh auth token)"
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:8080>. `NODE_AUTH_TOKEN` needs `read:packages` to install `@icco/react-common` from GitHub Packages.

## Add a place

Every dot is a `Point` feature in [`public/places.geojson`](public/places.geojson). Use the city's coordinates, never a street address.

```json
{
  "type": "Feature",
  "id": "london",
  "properties": {
    "city": "London, England",
    "kind": "lived",
    "year": 2014,
    "endYear": 2015,
    "photo": "/photos/london.jpg",
    "photoCredit": "Ada Lovelace, CC BY 4.0",
    "photoSource": "https://example.com/photo",
    "description": "First paragraph.\n\nSecond paragraph."
  },
  "geometry": { "type": "Point", "coordinates": [-0.13, 51.51] }
}
```

- `id` is a unique lowercase slug.
- `kind` is `lived` or `visited`.
- `year` is a number, or `null` when unknown. `endYear` is optional.
- `photo` is a file in `public/photos/`, about 960px wide. `photoCredit` and `photoSource` are optional.
- `description` is plain text. Blank lines split paragraphs, and long text scrolls in the panel.

The file is validated when the page renders, so `pnpm test:smoke` fails on a bad entry.

## Commands

| Command           | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| `pnpm dev`        | Development server on port 8080                           |
| `pnpm check`      | ESLint, type checking, and formatting checks              |
| `pnpm lint:fix`   | Fix lint and import order                                 |
| `pnpm format`     | Format files and sort Tailwind classes                    |
| `pnpm build`      | Production build with standalone output                   |
| `pnpm start`      | Local production server (`PORT`, default 8080)            |
| `pnpm test:smoke` | Start the production server and check the map and headers |

## How it works

- `src/lib/places.ts` reads and validates the GeoJSON with zod.
- `src/lib/world.ts` projects [world-atlas](https://github.com/topojson/world-atlas) land with d3-geo (Equal Earth). `/world.svg` is prerendered at build time and the page references it, so there are no map tiles or third-party requests.
- `src/components/PlaceMap.tsx` draws the dots, handles pan and zoom with d3-zoom, and opens `PlacePanel` for the selected place.

## Docker

```sh
export NODE_AUTH_TOKEN="$(gh auth token)"
docker build --secret id=npm_token,env=NODE_AUTH_TOKEN -t map.natwelch.com .
docker run --rm -p 8080:8080 map.natwelch.com
```

CI lints, type checks, checks formatting, builds, and smoke tests every push. Pull requests build the image, and `main` publishes `ghcr.io/icco/map.natwelch.com:main`.

## Photo credits

Seed photos come from Wikimedia Commons under the licenses listed in each feature's `photoCredit`, with the source page in `photoSource`.
