import { atom } from "jotai";

import {
  activeBlockIdAtom,
  itineraryBlocksAtom,
  openBlockIdsAtom,
} from "../overview/trip-builder.atoms";

export type ItineraryDayView = "all" | "single";

const dayViewAtom = atom<ItineraryDayView>("all");
const selectedDayIdAtom = atom<string | null>(null);

// Scroll tracking also activates My List blocks. Keep the day being edited
// separate so scrolling outside the itinerary cannot switch the visible day.
export const selectedItineraryDayAtom = atom((get) => {
  const days = get(itineraryBlocksAtom);
  return days.find((day) => day.id === get(selectedDayIdAtom)) ?? days[0] ?? null;
});

export const itineraryDayViewAtom = atom(
  (get) => get(dayViewAtom),
  (get, set, view: ItineraryDayView) => {
    if (view === get(dayViewAtom)) return;
    if (view === "single") {
      const activeDay = get(itineraryBlocksAtom).find((day) => day.id === get(activeBlockIdAtom));
      const day = activeDay ?? get(selectedItineraryDayAtom);
      set(selectedDayIdAtom, day?.id ?? null);
      if (day) set(activeBlockIdAtom, day.id);
    }
    set(dayViewAtom, view);
  },
);

export const visibleItineraryDaysAtom = atom((get) => {
  const days = get(itineraryBlocksAtom).map((block, index) => ({ block, index }));
  if (get(dayViewAtom) === "all") return days;
  const selectedId = get(selectedItineraryDayAtom)?.id;
  return days.filter(({ block }) => block.id === selectedId);
});

export const selectItineraryDayAtom = atom(null, (get, set, dayId: string) => {
  if (!get(itineraryBlocksAtom).some((day) => day.id === dayId)) return;
  set(selectedDayIdAtom, dayId);
  set(activeBlockIdAtom, dayId);
  if (get(dayViewAtom) === "all") {
    const openIds = get(openBlockIdsAtom);
    if (!openIds.includes(dayId)) set(openBlockIdsAtom, [...openIds, dayId]);
  }
});
