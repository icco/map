import { HEIGHT, landPath, WIDTH } from "@/lib/world"

export const dynamic = "force-static"

export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}"><path id="land" d="${landPath()}"/></svg>`
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  })
}
