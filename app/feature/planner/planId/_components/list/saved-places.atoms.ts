import { atom } from "jotai";
import {
  addPlaceVisitToBlockAtom,
  plannerReadOnlyAtom,
  tripBlocksAtom,
} from "../overview/trip-builder.atoms";
import {
  canSchedulePlace,
  collectListPlaces,
  savedPlaceKey,
} from "./saved-places-model";

export const savedListPlacesAtom = atom((get) =>
  collectListPlaces(get(tripBlocksAtom)),
);

export const scheduleSavedPlaceAtom = atom(
  null,
  (get, set, payload: { placeId: string; dayId: string; beforeItemId?: string }) => {
    if (get(plannerReadOnlyAtom)) return;
    const saved = get(savedListPlacesAtom).find(
      (entry) => savedPlaceKey(entry.place) === payload.placeId,
    );
    if (
      !saved ||
      !canSchedulePlace(get(tripBlocksAtom), saved.place, payload.dayId)
    )
      return;
    return set(addPlaceVisitToBlockAtom, {
      blockId: payload.dayId,
      place: saved.place,
      beforeItemId: payload.beforeItemId,
    });
  },
);

/** Adds several saved places to one day, skipping any the day already has. */
export const scheduleSavedPlacesAtom = atom(
  null,
  (_get, set, payload: { placeIds: readonly string[]; dayId: string }) => {
    let added = 0;
    for (const placeId of payload.placeIds) {
      if (set(scheduleSavedPlaceAtom, { placeId, dayId: payload.dayId })) added += 1;
    }
    return { added, skipped: payload.placeIds.length - added };
  },
);

export type MyListView = "planner" | "summary";
export const myListViewAtom = atom<MyListView>("planner");
