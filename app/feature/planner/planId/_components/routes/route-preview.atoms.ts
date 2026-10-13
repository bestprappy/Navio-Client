import { atom } from "jotai";
import type { RouteSegment } from "./trip-route.types";
import type { TransitJourneySort } from "./transit-journey-filters";

/** Temporary route inspection; opening directions never changes the saved itinerary. */
export const transitRoutePreviewAtom = atom<RouteSegment | null>(null);

/** One sort order for every leg, so comparing routes stays consistent across the trip. */
export const transitJourneySortAtom = atom<TransitJourneySort>("fastest");
