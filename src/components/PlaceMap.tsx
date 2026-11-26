"use client"

import { ArrowPathIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline"
import { select } from "d3-selection"
import {
  zoom,
  type ZoomBehavior,
  zoomIdentity,
  type ZoomTransform,
  zoomTransform,
} from "d3-zoom"
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { type MapPlace, PlacePanel } from "@/components/PlacePanel"
import { formatYears, whoLabels } from "@/lib/format"
import type { Who } from "@/lib/places"

const MAX_ZOOM = 48
const MAX_FIT_ZOOM = 6
const FOCUS_ZOOM = 10
const HIT_RADIUS = 14
const radius = { lived: 6, visited: 4.5 } as const

const filters = [
  { value: "all", label: "Everyone" },
  { value: "both", label: whoLabels.both },
  { value: "nat", label: "Nat alone" },
  { value: "mel", label: "Mel alone" },
] as const satisfies { value: Who | "all"; label: string }[]

const legend = [
  { kind: "lived", label: "Lived" },
  { kind: "visited", label: "Visited" },
] as const

function setPlaceParam(id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set("place", id)
  else url.searchParams.delete("place")
  window.history.replaceState(window.history.state, "", url)
}

export function PlaceMap({
  title,
  places: allPlaces,
  width,
  height,
  spherePath,
  graticulePath,
}: {
  title: string
  places: MapPlace[]
  width: number
  height: number
  spherePath: string
  graticulePath: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>(null)
  const homeRef = useRef<ZoomTransform>(zoomIdentity)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | SVGElement | null>(null)
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 })
  // Screen pixels per viewBox unit before zooming.
  const [scale, setScale] = useState(0.8)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [who, setWho] = useState<Who | "all">("all")
  const places = useMemo(
    () =>
      who === "all"
        ? allPlaces
        : allPlaces.filter((place) =>
            place.visits.some((visit) => visit.who === who)
          ),
    [allPlaces, who]
  )
  const countries = useMemo(
    () => new Set(places.map((place) => place.country)).size,
    [places]
  )
  const selected = places.find((place) => place.id === selectedId) ?? null
  const labeled = places.find((place) => place.id === (hoveredId ?? selectedId))

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
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

    let pxPerUnit = 1
    // Pinch and ctrl+scroll zoom through d3; plain scrolling and trackpad swipes pan.
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return
      event.preventDefault()
      const page = event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      const line = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1
      const unit = pxPerUnit * zoomTransform(svg).k
      behavior.translateBy(
        selection,
        (-event.deltaX * (page ? svg.clientWidth : line)) / unit,
        (-event.deltaY * (page ? svg.clientHeight : line)) / unit
      )
    }
    svg.addEventListener("wheel", onWheel, { passive: false })

    let placed = false
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
      pxPerUnit = next
      setScale(next)

      const xs = allPlaces.map((place) => place.x).sort((a, b) => a - b)
      const ys = allPlaces.map((place) => place.y).sort((a, b) => a - b)
      // On narrow screens the title card spans the map, so fit below it.
      const cardBox = cardRef.current?.getBoundingClientRect()
      const covered =
        cardBox && cardBox.width > box.width / 2 ? cardBox.bottom - box.top : 0
      const clearTop = top + covered / next
      const clearHeight = visibleHeight - covered / next
      const k = Math.min(
        MAX_FIT_ZOOM,
        Math.max(
          covered ? (1.5 * visibleHeight) / clearHeight : 1,
          0.8 *
            Math.min(
              visibleWidth / (xs[xs.length - 1] - xs[0] || 1),
              clearHeight / (ys[ys.length - 1] - ys[0] || 1)
            )
        )
      )
      // Center on the median place so narrow screens open where most places are.
      const fitted = zoomIdentity
        .translate(left + visibleWidth / 2, clearTop + clearHeight / 2)
        .scale(k)
        .translate(-xs[xs.length >> 1], -ys[ys.length >> 1])
      homeRef.current = behavior.constrain()(
        fitted,
        [
          [left, top],
          [left + visibleWidth, top + visibleHeight],
        ],
        [
          [0, 0],
          [width, height],
        ]
      )
      if (placed) return
      placed = true
      behavior.transform(selection, homeRef.current)

      const linked = allPlaces.find(
        (place) =>
          place.id === new URLSearchParams(window.location.search).get("place")
      )
      if (!linked) return
      behavior.scaleTo(selection, FOCUS_ZOOM)
      behavior.translateTo(selection, linked.x, linked.y)
      setSelectedId(linked.id)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    return () => {
      observer.disconnect()
      svg.removeEventListener("wheel", onWheel)
      selection.on(".zoom", null)
    }
  }, [width, height, allPlaces])

  const open = (id: string) => {
    const active = document.activeElement
    const element =
      active instanceof HTMLElement || active instanceof SVGElement
        ? active
        : null
    // Switching places from inside the panel keeps the original opener.
    if (element && !element.closest("[data-panel]")) openerRef.current = element
    setSelectedId(id)
    setPlaceParam(id)
  }

  const close = useCallback(() => {
    setSelectedId(null)
    setPlaceParam(null)
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
    if (svgRef.current && zoomRef.current)
      zoomRef.current.transform(select(svgRef.current), homeRef.current)
  }

  const unit = 1 / (scale * transform.k)
  const card =
    "rounded-box bg-base-100/90 shadow-lg ring-1 ring-base-content/5 backdrop-blur"

  return (
    <div
      data-map
      className="relative h-[calc(100dvh-8rem)] min-h-[420px] w-full overflow-hidden bg-[var(--map-ocean)] sm:h-[calc(100dvh-6.5rem)]"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        role="group"
        aria-label="World map of places"
        className="absolute inset-0 block size-full cursor-grab touch-none select-none active:cursor-grabbing"
      >
        <g
          transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
        >
          <path
            d={graticulePath}
            fill="none"
            stroke="var(--map-graticule)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <use
            href="/world.svg#land"
            fill="var(--map-land)"
            stroke="var(--map-coast)"
            strokeWidth={0.75}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={spherePath}
            fill="none"
            stroke="var(--map-coast)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {places.map((place) => {
            const active = place.id === selectedId || place.id === hoveredId
            return (
              <g
                key={place.id}
                role="button"
                tabIndex={0}
                aria-label={`${place.city}, ${place.kind}, ${formatYears(place)}`}
                aria-pressed={place.id === selectedId}
                data-place={place.id}
                data-kind={place.kind}
                transform={`translate(${place.x},${place.y}) scale(${unit})`}
                className="place-dot cursor-pointer outline-none"
                onClick={(event) => selectNearest(event, place.id)}
                onPointerEnter={() => setHoveredId(place.id)}
                onPointerLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(place.id)}
                onBlur={() => setHoveredId(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    open(place.id)
                  }
                }}
              >
                <circle r={HIT_RADIUS} fill="transparent" />
                <circle
                  r={radius[place.kind] + (active ? 2.5 : 0)}
                  strokeWidth={1.5}
                />
              </g>
            )
          })}
          {labeled && (
            <text
              aria-hidden="true"
              transform={`translate(${labeled.x},${labeled.y}) scale(${unit})`}
              x={radius[labeled.kind] + 6}
              y={4.5}
              fill="var(--color-base-content)"
              stroke="var(--map-halo)"
              strokeWidth={4}
              strokeLinejoin="round"
              paintOrder="stroke"
              className="pointer-events-none text-[13px] font-semibold"
            >
              {labeled.city}
            </text>
          )}
        </g>
      </svg>

      <div
        ref={cardRef}
        className={`${card} absolute inset-x-3 top-3 p-3 sm:right-auto sm:w-auto sm:min-w-80 sm:p-4`}
      >
        <h1 className="text-xl leading-tight font-medium">{title}</h1>
        <p aria-live="polite" className="mt-0.5 text-sm text-base-content/70">
          {places.length} {places.length === 1 ? "place" : "places"} in{" "}
          {countries} {countries === 1 ? "country" : "countries"}
        </p>
        <div
          role="group"
          aria-label="Show places by who went"
          className="mt-3 flex rounded-full bg-base-200 p-0.5"
        >
          {filters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={who === value}
              data-who={value}
              onClick={() => {
                setWho(value)
                setSelectedId(null)
                setPlaceParam(null)
              }}
              className="flex-1 cursor-pointer rounded-full px-1.5 py-1 text-xs font-medium whitespace-nowrap text-base-content/70 transition-colors hover:text-base-content aria-pressed:bg-[var(--map-lived)] aria-pressed:text-base-100 sm:text-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul
        aria-label="Legend"
        className={`${card} absolute bottom-3 left-3 flex gap-4 px-3 py-2 text-sm`}
      >
        {legend.map(({ kind, label }) => (
          <li key={kind} className="flex items-center gap-1.5">
            <svg viewBox="-8 -8 16 16" className="size-3.5" aria-hidden="true">
              <g className="place-dot" data-kind={kind}>
                <circle r={radius[kind]} strokeWidth={1.5} />
              </g>
            </svg>
            {label}
          </li>
        ))}
      </ul>

      <div
        className={`${card} absolute right-3 bottom-3 join join-vertical transition-[right] ${selected ? "md:right-[21.5rem] lg:right-[25.5rem]" : ""}`}
      >
        <button
          type="button"
          className="btn join-item btn-square border-0 btn-ghost btn-sm"
          aria-label="Zoom in"
          onClick={() => zoomBy(2)}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn join-item btn-square border-0 btn-ghost btn-sm"
          aria-label="Zoom out"
          onClick={() => zoomBy(0.5)}
        >
          <MinusIcon className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn join-item btn-square border-0 btn-ghost btn-sm"
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
  )
}
