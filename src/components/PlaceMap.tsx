"use client"

import { ArrowPathIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline"
import { select } from "d3-selection"
import { zoom, type ZoomBehavior, zoomIdentity } from "d3-zoom"
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { type MapPlace, PlacePanel } from "@/components/PlacePanel"
import { formatYears } from "@/lib/format"

const MAX_ZOOM = 48
const FOCUS_ZOOM = 10
const DOT_RADIUS = 6
const HIT_RADIUS = 14

const kinds = [
  { kind: "lived", label: "Lived" },
  { kind: "visited", label: "Visited" },
] as const

export function PlaceMap({
  places,
  width,
  height,
  spherePath,
}: {
  places: MapPlace[]
  width: number
  height: number
  spherePath: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLElement | SVGElement | null>(null)
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 })
  // Screen pixels per viewBox unit before zooming.
  const [scale, setScale] = useState(0.8)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = places.find((place) => place.id === selectedId) ?? null

  const center = useMemo<[number, number]>(() => {
    const xs = places.map((place) => place.x)
    const ys = places.map((place) => place.y)
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ]
  }, [places])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      // Plain scrolling stays with the page; pinch and ctrl+scroll zoom.
      .filter((event: Event) =>
        event instanceof WheelEvent
          ? event.ctrlKey || event.metaKey
          : !(event instanceof MouseEvent) || !event.button
      )
      .on("zoom", ({ transform: next }) =>
        setTransform({ k: next.k, x: next.x, y: next.y })
      )
    zoomRef.current = behavior
    const selection = select(svg).call(behavior)

    let centered = false
    // The SVG is cropped to fill its box, so tell d3 which part is visible.
    const measure = () => {
      const box = svg.getBoundingClientRect()
      if (!box.width || !box.height) return
      const next = Math.max(box.width / width, box.height / height)
      const visibleWidth = box.width / next
      const visibleHeight = box.height / next
      const left = (width - visibleWidth) / 2
      const top = (height - visibleHeight) / 2
      behavior.extent([
        [left, top],
        [left + visibleWidth, top + visibleHeight],
      ])
      setScale(next)
      if (centered) return
      centered = true
      behavior.translateTo(selection, ...center)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    return () => {
      observer.disconnect()
      selection.on(".zoom", null)
    }
  }, [width, height, center])

  const open = (id: string) => {
    const active = document.activeElement
    const element =
      active instanceof HTMLElement || active instanceof SVGElement
        ? active
        : null
    // Switching places from inside the panel keeps the original opener.
    if (element && !element.closest("[data-panel]")) openerRef.current = element
    setSelectedId(id)
  }

  const close = useCallback(() => {
    setSelectedId(null)
    openerRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    headingRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedId, close])

  // Dots overlap when zoomed out, so open the one closest to the pointer.
  const selectNearest = (
    event: ReactMouseEvent<SVGGElement>,
    fallback: string
  ) => {
    const matrix = svgRef.current?.getScreenCTM()
    // Assistive technology clicks carry no pointer position.
    if (!matrix || event.detail === 0) return open(fallback)
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse()
    )
    const x = (point.x - transform.x) / transform.k
    const y = (point.y - transform.y) / transform.k
    const nearest = places.reduce((best, place) =>
      Math.hypot(place.x - x, place.y - y) < Math.hypot(best.x - x, best.y - y)
        ? place
        : best
    )
    open(nearest.id)
  }

  const zoomBy = (factor: number) => {
    if (svgRef.current && zoomRef.current)
      zoomRef.current.scaleBy(select(svgRef.current), factor)
  }

  const reset = () => {
    if (!svgRef.current || !zoomRef.current) return
    const selection = select(svgRef.current)
    zoomRef.current.transform(selection, zoomIdentity)
    zoomRef.current.translateTo(selection, ...center)
  }

  const focus = (place: MapPlace) => {
    open(place.id)
    if (!svgRef.current || !zoomRef.current) return
    const selection = select(svgRef.current)
    zoomRef.current.scaleTo(selection, Math.max(transform.k, FOCUS_ZOOM))
    zoomRef.current.translateTo(selection, place.x, place.y)
    svgRef.current.scrollIntoView({ block: "nearest" })
  }

  const unit = 1 / (scale * transform.k)

  return (
    <div>
      <div className="relative overflow-hidden rounded-box border border-base-300 bg-base-200">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid slice"
          role="group"
          aria-label="World map of places"
          className="block aspect-[4/3] w-full cursor-grab touch-none select-none active:cursor-grabbing md:aspect-[1000/487]"
        >
          <g
            transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
          >
            <path d={spherePath} className="fill-base-100" />
            <use href="/world.svg#land" className="fill-base-300" />
            <path
              d={spherePath}
              fill="none"
              strokeWidth={unit}
              className="stroke-base-300"
            />
            {places.map((place) => {
              const active = place.id === selectedId
              return (
                <g
                  key={place.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${place.city}, ${place.kind}, ${formatYears(place)}`}
                  aria-pressed={active}
                  data-place={place.id}
                  data-kind={place.kind}
                  transform={`translate(${place.x},${place.y}) scale(${unit})`}
                  className="place-dot cursor-pointer outline-none"
                  onClick={(event) => selectNearest(event, place.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      open(place.id)
                    }
                  }}
                >
                  <circle r={HIT_RADIUS} fill="transparent" />
                  <circle
                    r={active ? DOT_RADIUS + 3 : DOT_RADIUS}
                    strokeWidth={place.kind === "visited" ? 3 : 1.5}
                  />
                </g>
              )
            })}
          </g>
        </svg>

        <div className="absolute bottom-2 left-2 join join-vertical shadow">
          <button
            type="button"
            className="btn join-item btn-square btn-sm"
            aria-label="Zoom in"
            onClick={() => zoomBy(2)}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn join-item btn-square btn-sm"
            aria-label="Zoom out"
            onClick={() => zoomBy(0.5)}
          >
            <MinusIcon className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn join-item btn-square btn-sm"
            aria-label="Reset map"
            onClick={reset}
          >
            <ArrowPathIcon className="size-4" aria-hidden="true" />
          </button>
        </div>

        {selected && (
          <PlacePanel
            key={selected.id}
            place={selected}
            onClose={close}
            headingRef={headingRef}
          />
        )}
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {kinds.map(({ kind, label }) => (
          <section key={kind} aria-labelledby={`${kind}-heading`}>
            <h2
              id={`${kind}-heading`}
              className="mb-2 flex items-center gap-2 text-lg font-semibold"
            >
              <svg
                viewBox="-10 -10 20 20"
                className="size-4"
                aria-hidden="true"
              >
                <g className="place-dot" data-kind={kind}>
                  <circle r={7} strokeWidth={kind === "visited" ? 3.5 : 1.5} />
                </g>
              </svg>
              {label}
            </h2>
            <ul>
              {places
                .filter((place) => place.kind === kind)
                .map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      aria-pressed={place.id === selectedId}
                      onClick={() => focus(place)}
                      className="flex w-full cursor-pointer items-baseline justify-between gap-4 border-b border-base-200 py-2 text-left text-link hover:underline aria-pressed:font-semibold"
                    >
                      <span>{place.city}</span>
                      <span className="shrink-0 text-sm text-base-content/60">
                        {formatYears(place)}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
