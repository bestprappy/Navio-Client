import { getPlaceTagCategory, type PlaceTagCategory } from "../place/place-tag-category";

/** A visit's length when nobody has set one. */
export const DEFAULT_VISIT_MINUTES = 60;

/**
 * Typical visit lengths by kind of place, shared by Calculate times and Auto plan so a
 * museum gets the same two hours whichever one times it.
 */
const VISIT_MINUTES: Partial<Record<PlaceTagCategory, number>> = {
  culture: 120, wildlife: 150, entertainment: 120, beach: 120, nature: 90, sports: 90, wellness: 90,
  shopping: 75, landmark: 60, worship: 45, groceries: 30, restaurant: 75, cafe: 45, bakery: 30, bar: 90,
};

export function typicalVisitMinutes(category: PlaceTagCategory): number {
  return VISIT_MINUTES[category] ?? DEFAULT_VISIT_MINUTES;
}

/** From the stop's provider type, e.g. "museum"; untyped stops get an hour. */
export function typicalVisitMinutesForType(placeType: string | undefined): number {
  return placeType ? typicalVisitMinutes(getPlaceTagCategory(placeType, "")) : DEFAULT_VISIT_MINUTES;
}
