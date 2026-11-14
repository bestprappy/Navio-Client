/**
 * Coarse kinds of stop, used only to balance a day's suggestions. Provider
 * types are fine-grained ("thai_restaurant", "buddhist_temple"); the shelf only
 * needs to know whether a day already has a meal, a sight or time outdoors.
 */
export type RecommendationCategory = "food" | "nightlife" | "stay" | "nature" | "shopping" | "sight";

/** Things that are not somewhere you visit: stations, chargers, bare addresses. */
const NOT_A_VISIT = new Set(["station", "airport", "transit", "parking", "terminal", "stop", "charging",
  "address", "route", "premise", "subpremise", "locality", "political", "postal", "intersection"]);
const ATTRACTION_PARKS = new Set(["amusement_park", "theme_park", "water_park"]);
const STAY_TYPES = new Set(["bed_and_breakfast", "guest_house", "farmstay"]);
const STAY = new Set(["lodging", "hotel", "hostel", "motel", "resort", "inn", "campground", "camping", "accommodation"]);
const FOOD = new Set(["restaurant", "cafe", "coffee", "bakery", "food", "meal", "dessert", "ice", "tea", "bistro",
  "diner", "deli", "confectionery", "juice", "brunch", "eat", "dining", "dine"]);
const NIGHTLIFE = new Set(["bar", "pub", "club", "nightclub", "brewery", "winery", "lounge", "karaoke", "nightlife"]);
const NATURE = new Set(["park", "garden", "beach", "hiking", "natural", "nature", "lake", "mountain", "forest",
  "waterfall", "island", "outdoors"]);
const SHOPPING = new Set(["market", "mall", "store", "shop", "shopping", "supermarket", "boutique"]);

function tokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z]+/).filter(Boolean);
}

function classify(value: string): RecommendationCategory | null | undefined {
  const type = value.trim().toLowerCase();
  if (!type) return undefined;
  const words = tokens(type);
  if (words.some((word) => NOT_A_VISIT.has(word))) return null;
  if (ATTRACTION_PARKS.has(type)) return "sight";
  if (STAY_TYPES.has(type) || words.some((word) => STAY.has(word))) return "stay";
  if (words.some((word) => FOOD.has(word))) return "food";
  if (words.some((word) => NIGHTLIFE.has(word))) return "nightlife";
  if (words.some((word) => NATURE.has(word))) return "nature";
  if (words.some((word) => SHOPPING.has(word))) return "shopping";
  return "sight";
}

/**
 * A stop's kind from its provider type, falling back to the guide section it
 * was listed under ("eat", "stay"). `null` means it is not a visit at all, or
 * nothing is known about it, so it neither fills nor opens a gap.
 */
export function recommendationCategory(placeType?: string | null, sectionId?: string | null): RecommendationCategory | null {
  const fromType = placeType ? classify(placeType) : undefined;
  if (fromType !== undefined) return fromType;
  const fromSection = sectionId ? classify(sectionId) : undefined;
  return fromSection ?? null;
}
