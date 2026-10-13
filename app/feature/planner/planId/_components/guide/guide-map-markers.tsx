"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useMap } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

import { AppearanceGoogleMarker as MapMarker } from "@/components/map/appearance-google-marker";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../constants/trip-block-colors";
import { GUIDE_PAGE_SIZE } from "./destination-guide";
import { revealGuidePlaceCard } from "./guide-dom";
import {
  activeGuideAtom,
  guideBrowseAtom,
  selectedGuidePlaceIdAtom,
  selectGuidePlaceAtom,
  visibleGuideSectionsAtom,
} from "./guide.atoms";

const FIT_PADDING_PX = 64;

/** Numbered pins for the listed guide places. Must render inside the Google map. */
export function GuideMapMarkers() {
  const map = useMap();
  const guide = useAtomValue(activeGuideAtom);
  const blockId = useAtomValue(guideBrowseAtom)?.blockId;
  const sections = useAtomValue(visibleGuideSectionsAtom);
  const selectedPlaceId = useAtomValue(selectedGuidePlaceIdAtom);
  const selectPlace = useSetAtom(selectGuidePlaceAtom);

  useEffect(() => {
    // Frame the first page of every section once, when the guide opens.
    if (!map || !guide || !blockId || typeof google === "undefined") return;
    const bounds = new google.maps.LatLngBounds();
    guide.sections.forEach((section) =>
      section.places.slice(0, GUIDE_PAGE_SIZE).forEach((place) => bounds.extend({ lat: place.lat, lng: place.lng })),
    );
    if (!bounds.isEmpty()) map.fitBounds(bounds, FIT_PADDING_PX);
  }, [blockId, guide, map]);

  return sections.flatMap((section) => {
    const color = getTripBlockColorById(section.colorId);
    return section.visiblePlaces.map((place, index) => {
      const selected = place.id === selectedPlaceId;
      const number = index + 1;
      return (
        <MapMarker key={place.id} position={{ lat: place.lat, lng: place.lng }} zIndex={selected ? 30 : 24}>
          <button
            type="button"
            aria-label={`${section.title} ${number}: ${place.name}`}
            aria-pressed={selected}
            className="relative block cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(event) => {
              event.stopPropagation();
              selectPlace(place.id);
              revealGuidePlaceCard(place.id);
            }}
          >
            <MapPin
              aria-hidden="true"
              className={cn("transition-all motion-reduce:transition-none [&>circle]:hidden", selected ? "size-12 drop-shadow-lg" : "size-8 drop-shadow-md hover:scale-110")}
              style={{ color: color.value, fill: color.value, filter: "var(--map-marker-shadow)" }}
            />
            <span
              className={cn("pointer-events-none absolute left-1/2 top-[41.67%] -translate-x-1/2 -translate-y-1/2 font-bold leading-none", selected ? "text-sm" : "text-[10px]")}
              style={{ color: color.foreground }}
            >
              {number}
            </span>
          </button>
        </MapMarker>
      );
    });
  });
}
