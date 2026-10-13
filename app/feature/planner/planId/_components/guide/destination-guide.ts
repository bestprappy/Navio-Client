import type { PlaceSearchResult, TripBlockColorId, TripDestination } from "../constants/types";

/** A list's id in the written guide; the seed guide uses "visit", "eat" and "stay". */
export type GuideSectionId = string;

/**
 * A curated place. Name, address and coordinates identify it before the
 * provider responds; photo and rating always come from the live place lookup.
 */
export type GuidePlace = PlaceSearchResult & {
  /** Navio's own write-up, not provider content. */
  blurb: string;
  tags: readonly string[];
};

export type GuideSection = {
  id: GuideSectionId;
  title: string;
  colorId: TripBlockColorId;
  /** The category's icon, as the guide editor names it. */
  iconId?: string;
  places: readonly GuidePlace[];
};

/**
 * The guide as written, in reading order: section headings, place cards, and
 * the formatted text between them (note markdown).
 */
export type GuideDocumentBlock =
  | { kind: "text"; markdown: string }
  | { kind: "section"; sectionId: GuideSectionId }
  | { kind: "place"; sectionId: GuideSectionId; placeId: string; number: number };

export type DestinationGuide = {
  id: string;
  name: string;
  country: string;
  description: string;
  /** Provider ids of the destination itself, as a trip day stores them. */
  destinationPlaceIds: readonly string[];
  /** Normalized names that also mean this destination. */
  aliases: readonly string[];
  /** The listed place whose live photo covers the guide. */
  coverPlaceId: string;
  /** Who wrote it, shown as a byline; guides written in the admin console are by the Navio team. */
  author?: string;
  /** The written guide; when present, the guide view shows it instead of plain section lists. */
  document?: readonly GuideDocumentBlock[];
  sections: readonly GuideSection[];
};

export type VisibleGuideSection = GuideSection & {
  visiblePlaces: readonly GuidePlace[];
  visibleCount: number;
};

export type GuideListAction = "more" | "all" | "less";

/** How many places each section lists before Show more. */
export const GUIDE_PAGE_SIZE = 5;

export function normalizeDestinationName(name: string): string {
  return name
    .split(",")[0]
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** The guide for a day's destination, or null when Navio has none for it. */
export function findDestinationGuide(
  destination: Pick<TripDestination, "id" | "name"> | null | undefined,
  guides: readonly DestinationGuide[],
): DestinationGuide | null {
  if (!destination) return null;
  const name = normalizeDestinationName(destination.name);
  return guides.find((guide) =>
    guide.destinationPlaceIds.includes(destination.id) ||
    (name.length > 0 && guide.aliases.includes(name)),
  ) ?? null;
}

export function clampVisibleCount(count: number | undefined, total: number): number {
  if (count === undefined || !Number.isFinite(count)) return Math.min(GUIDE_PAGE_SIZE, total);
  return Math.min(Math.max(Math.trunc(count), Math.min(GUIDE_PAGE_SIZE, total)), total);
}

export function nextVisibleCount(current: number, total: number, action: GuideListAction): number {
  if (action === "all") return total;
  if (action === "less") return Math.min(GUIDE_PAGE_SIZE, total);
  return Math.min(clampVisibleCount(current, total) + GUIDE_PAGE_SIZE, total);
}

export type GuidePick = { place: GuidePlace; section: GuideSection };

/**
 * A short mixed selection for the day card: the top place of each section in
 * turn, so the carousel shows sights, food and stays together.
 */
export function getGuidePicks(guide: DestinationGuide, limit: number): GuidePick[] {
  const picks: GuidePick[] = [];
  const depth = Math.max(0, ...guide.sections.map((section) => section.places.length));
  for (let rank = 0; rank < depth && picks.length < limit; rank += 1) {
    for (const section of guide.sections) {
      const place = section.places[rank];
      if (place && picks.length < limit) picks.push({ place, section });
    }
  }
  return picks;
}

export function getVisibleGuideSections(
  guide: DestinationGuide,
  counts: Partial<Record<GuideSectionId, number>>,
): VisibleGuideSection[] {
  return guide.sections.map((section) => {
    const visibleCount = clampVisibleCount(counts[section.id], section.places.length);
    return { ...section, visibleCount, visiblePlaces: section.places.slice(0, visibleCount) };
  });
}
