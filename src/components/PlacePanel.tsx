import { XMarkIcon } from "@heroicons/react/24/outline"
import Image from "next/image"
import type { RefObject } from "react"

import { formatYears } from "@/lib/format"
import type { Place } from "@/lib/places"

export type MapPlace = Omit<Place, "coordinates"> & { x: number; y: number }

export function PlacePanel({
  place,
  onClose,
  headingRef,
}: {
  place: MapPlace
  onClose: () => void
  headingRef: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <aside
      aria-label={`About ${place.city}`}
      data-testid="place-panel"
      data-panel
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[65dvh] flex-col overflow-hidden rounded-t-2xl bg-base-100 shadow-2xl md:absolute md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-80 md:rounded-none md:border-l md:border-base-300 md:shadow-xl"
    >
      <div className="relative h-40 shrink-0 bg-base-300 md:h-36">
        <Image
          src={place.photo}
          alt={`Photo of ${place.city}`}
          fill
          unoptimized
          sizes="(min-width: 768px) 320px, 100vw"
          className="object-cover"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="btn absolute top-2 right-2 btn-circle btn-sm"
        >
          <XMarkIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="shrink-0 px-4 pt-3 pb-2">
        <p className="text-sm text-base-content/70">
          <span className="capitalize">{place.kind}</span>
          {" · "}
          <span data-testid="place-year">{formatYears(place)}</span>
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold outline-none"
        >
          {place.city}
        </h2>
      </div>
      <div
        data-testid="place-description"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4"
      >
        {place.description.split(/\n{2,}/).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {place.photoCredit && (
          <p className="text-xs text-base-content/60">
            Photo:{" "}
            {place.photoSource ? (
              <a
                href={place.photoSource}
                rel="noreferrer"
                className="text-link underline"
              >
                {place.photoCredit}
              </a>
            ) : (
              place.photoCredit
            )}
          </p>
        )}
      </div>
    </aside>
  )
}
