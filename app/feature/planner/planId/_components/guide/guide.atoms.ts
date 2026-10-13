import { atom } from "jotai";

import type { PlaceSearchResult } from "../constants/types";
import {
  activeBlockIdAtom,
  activeSearchAtom,
  addPlaceVisitToBlockAtom,
  selectedEvChargerIdAtom,
  selectedSearchPlaceAtom,
  selectedTripPlaceItemIdAtom,
  startPlaceSearchAtom,
} from "../overview/trip-builder.atoms";
import type { Guide } from "@/app/feature/admin/_components/guides/guide-model";
import { toDestinationGuideCached } from "@/app/feature/admin/_components/guides/guide-to-destination";
import {
  getVisibleGuideSections,
  nextVisibleCount,
  type DestinationGuide,
  type GuideListAction,
  type GuideSectionId,
} from "./destination-guide";

/**
 * Published guides fetched from the shared library by TanStack Query.
 */
export const publishedGuidesAtom = atom<readonly Guide[]>([]);
export const destinationGuidesAtom = atom((get) =>
  get(publishedGuidesAtom).filter((guide) => guide.status === "PUBLISHED").flatMap((guide): DestinationGuide[] => {
    const destinationGuide = toDestinationGuideCached(guide);
    return destinationGuide ? [destinationGuide] : [];
  }),
);

export type GuideBrowseState = {
  guideId: string;
  /** The day whose Browse all opened the guide; places are added to it. */
  blockId: string;
};

/** Non-null while the drawer shows a destination guide instead of the plan. */
export const guideBrowseAtom = atom<GuideBrowseState | null>(null);

const guideVisibleCountsAtom = atom<Partial<Record<GuideSectionId, number>>>({});

export const activeGuideAtom = atom((get) => {
  const browse = get(guideBrowseAtom);
  return browse ? get(destinationGuidesAtom).find((guide) => guide.id === browse.guideId) ?? null : null;
});

export const visibleGuideSectionsAtom = atom((get) => {
  const guide = get(activeGuideAtom);
  if (!guide) return [];
  // A written guide shows every place in its text, so the map pins all of them.
  if (guide.document) return guide.sections.map((section) => ({ ...section, visibleCount: section.places.length, visiblePlaces: section.places }));
  return getVisibleGuideSections(guide, get(guideVisibleCountsAtom));
});

/** Ids of the places currently listed, which the map draws as numbered pins. */
export const visibleGuidePlaceIdsAtom = atom((get) =>
  new Set(get(visibleGuideSectionsAtom).flatMap((section) => section.visiblePlaces.map((place) => place.id))),
);

export const selectedGuidePlaceIdAtom = atom((get) => {
  if (!get(guideBrowseAtom)) return null;
  const place = get(selectedSearchPlaceAtom);
  return place && get(visibleGuidePlaceIdsAtom).has(place.id) ? place.id : null;
});

export const openGuideBrowserAtom = atom(null, (_get, set, state: GuideBrowseState) => {
  set(activeSearchAtom, null);
  set(selectedTripPlaceItemIdAtom, null);
  set(selectedEvChargerIdAtom, null);
  set(guideVisibleCountsAtom, {});
  set(activeBlockIdAtom, state.blockId);
  set(guideBrowseAtom, state);
});

/** Opens the guide with one place already selected, from a day card's carousel. */
export const openGuideAtPlaceAtom = atom(
  null,
  (_get, set, { placeId, ...state }: GuideBrowseState & { placeId: string }) => {
    set(openGuideBrowserAtom, state);
    set(selectGuidePlaceAtom, placeId);
  },
);

export const closeGuideBrowserAtom = atom(null, (get, set) => {
  if (!get(guideBrowseAtom)) return;
  // The open preview belongs to the guide, so it closes with it.
  set(activeSearchAtom, null);
  set(guideBrowseAtom, null);
});

export const changeGuideListAtom = atom(
  null,
  (get, set, { sectionId, action }: { sectionId: GuideSectionId; action: GuideListAction }) => {
    const section = get(visibleGuideSectionsAtom).find((entry) => entry.id === sectionId);
    if (!section) return;
    const visibleCount = nextVisibleCount(section.visibleCount, section.places.length, action);
    set(guideVisibleCountsAtom, (counts) => ({ ...counts, [sectionId]: visibleCount }));
    // A preview of a place that is no longer listed would point at a hidden pin.
    if (action === "less") set(activeSearchAtom, null);
  },
);

/** Adds a guide place, with its live photo and rating, to the end of a day. */
export const addGuidePlaceToDayAtom = atom(
  null,
  (_get, set, { blockId, place }: { blockId: string; place: PlaceSearchResult }) =>
    set(addPlaceVisitToBlockAtom, {
      blockId,
      place: { ...place, placeId: place.id, placeType: place.primaryType },
    }),
);

/**
 * Opens the map preview for a listed place. Previous and next step through the
 * same section, and Add to trip targets the day the guide was opened from.
 */
export const selectGuidePlaceAtom = atom(null, (get, set, placeId: string) => {
  const browse = get(guideBrowseAtom);
  if (!browse) return;
  const section = get(visibleGuideSectionsAtom).find((entry) =>
    entry.visiblePlaces.some((place) => place.id === placeId),
  );
  if (!section) return;
  set(startPlaceSearchAtom, {
    blockId: browse.blockId,
    query: section.title,
    results: [...section.visiblePlaces],
    selectedIndex: section.visiblePlaces.findIndex((place) => place.id === placeId),
  });
});
