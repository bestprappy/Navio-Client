import type { PlacePopularityResponse } from "@/lib/place-popularity-api";

import type { PlaceItem, PlaceSearchResult, TripDestination } from "../constants/types";
import { findDestinationGuide, getGuidePicks, type DestinationGuide, type GuideSection } from "../guide/destination-guide";
import { recommendationCategory, type RecommendationCategory } from "./place-recommendation-category";

/** Why a card is on the shelf; the most specific true reason is shown. */
export type RecommendationReason =
  | { kind: "popular"; travelers: number }
  | { kind: "near"; stopName: string }
  | { kind: "gap"; category: RecommendationCategory }
  | { kind: "pick" };

export type PlaceRecommendation = {
  place: PlaceSearchResult;
  section: Pick<GuideSection, "id" | "colorId" | "iconId">;
  travelerCount?: number;
  reason: RecommendationReason;
};

export type RecommendationStop = Pick<PlaceItem, "placeId" | "name" | "lat" | "lng" | "placeType">;

/** What the day already holds, so suggestions complement it instead of repeating it. */
export type RecommendationContext = {
  /** The day's own stops; ones outside the destination radius are ignored. */
  dayStops: readonly RecommendationStop[];
  /** Canonical ids of every place already planned anywhere in the trip; they are never suggested. */
  plannedIds: ReadonlySet<string>;
  /** The day's position in the trip, so days with the same destination see different guide picks. */
  dayIndex: number;
};

const RADIUS_KM = 50;
/** A stop this close is worth naming as the reason ("Near Wat Pho"). */
const NEAR_KM = 1.5;
/** Two picks this close are effectively the same stop on the map. */
const SAME_AREA_KM = 0.5;
/** Kinds whose absence from a day is worth filling; stays and nightlife are never pushed. */
const GAP_CATEGORIES: ReadonlySet<RecommendationCategory> = new Set(["food", "sight", "nature", "shopping"]);

/**
 * Score weights. Real traveler evidence outranks editorial order, but a guide
 * pick that sits beside the day's stops and fills a missing meal can still win.
 */
const WEIGHT = {
  popular: 0.5,
  popularGrowth: 0.2,
  guide: 0.3,
  nearby: 0.3,
  /** Distance (km) at which the nearby score has fallen to about 37%. */
  nearbyFalloffKm: 2,
  gap: 0.2,
  stay: -0.15,
  repeatCategory: -0.12,
  sameArea: -0.08,
} as const;

export function canonicalPlaceId(id: string): string {
  return /^ChI[\w-]+$/.test(id) ? `GOOGLE:${id}` : id;
}

type Point = { lat: number; lng: number };

function distanceKm(a: Point, b: Point): number {
  if (![a.lat, a.lng, b.lat, b.lng].every(Number.isFinite)) return Number.POSITIVE_INFINITY;
  const radians = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * radians / 2) ** 2
    + Math.cos(a.lat * radians) * Math.cos(b.lat * radians)
    * Math.sin((b.lng - a.lng) * radians / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

const withinDestination = (point: Point, destination: Point) => distanceKm(point, destination) <= RADIUS_KM;

type Candidate = {
  recommendation: Omit<PlaceRecommendation, "reason">;
  category: RecommendationCategory | null;
  /** 1 for the first guide pick shown on this day, falling towards 0; absent when traveler evidence ranks it instead. */
  guidePrior?: number;
};

/** Guide picks and qualified popular places near the destination, deduplicated and minus planned places. */
function gatherCandidates(
  destination: TripDestination,
  guides: readonly DestinationGuide[],
  popularity: PlacePopularityResponse | undefined,
  context: RecommendationContext,
  limit: number,
): Candidate[] {
  const guide = findDestinationGuide(destination, guides);
  const curated: Candidate[] = [];
  const seen = new Set<string>();
  for (const pick of guide ? getGuidePicks(guide, 60) : []) {
    const id = canonicalPlaceId(pick.place.id);
    if (seen.has(id) || context.plannedIds.has(id) || !withinDestination(pick.place, destination)) continue;
    seen.add(id);
    curated.push({
      recommendation: { place: { ...pick.place, id }, section: pick.section },
      category: recommendationCategory(pick.place.primaryType, pick.section.id),
    });
  }
  // Rotate whole pages so day 2 opens on the picks day 1 did not show.
  const offset = curated.length > 0 ? (context.dayIndex * limit) % curated.length : 0;
  const rotated = [...curated.slice(offset), ...curated.slice(0, offset)]
    .map((candidate, rank, all): Candidate => ({ ...candidate, guidePrior: 1 - rank / all.length }));
  const byId = new Map(rotated.map((candidate) => [candidate.recommendation.place.id, candidate]));

  const minimum = popularity?.minimumTravelers ?? 5;
  const ranked = [...(popularity?.items ?? [])]
    .sort((a, b) => b.travelerCount - a.travelerCount || a.placeId.localeCompare(b.placeId));
  const popular: Candidate[] = [];
  for (const item of ranked) {
    if (item.travelerCount < minimum || context.plannedIds.has(item.placeId)) continue;
    const known = byId.get(item.placeId);
    if (known) {
      byId.delete(item.placeId);
      popular.push({ ...known, guidePrior: undefined, recommendation: { ...known.recommendation, travelerCount: item.travelerCount } });
    } else if (item.place && withinDestination(item.place, destination) && !popular.some((c) => c.recommendation.place.id === item.placeId)) {
      const provider = item.placeId.startsWith("MAPBOX:") ? "MAPBOX" : "GOOGLE";
      popular.push({
        recommendation: {
          place: { ...item.place, id: item.placeId, provider, providerPlaceId: item.placeId.slice(provider.length + 1),
            primaryType: item.place.primaryType ?? undefined, imageUrl: undefined },
          section: { id: "visit", colorId: "blue" },
          travelerCount: item.travelerCount,
        },
        category: recommendationCategory(item.place.primaryType, "visit"),
      });
    }
  }
  return [...popular, ...byId.values()];
}

type Scored = Candidate & { score: number; reason: RecommendationReason };

function scoreCandidate(
  candidate: Candidate,
  stops: readonly RecommendationStop[],
  dayCategories: ReadonlySet<RecommendationCategory>,
  minimum: number,
): Scored {
  const { travelerCount, place } = candidate.recommendation;
  let score = 0;
  if (travelerCount !== undefined) {
    // Logarithmic: ten times the threshold earns the full bonus, so one hotspot cannot dominate.
    score += WEIGHT.popular + WEIGHT.popularGrowth * Math.min(1, Math.log(travelerCount / minimum) / Math.log(10));
  } else if (candidate.guidePrior !== undefined) {
    score += WEIGHT.guide * candidate.guidePrior;
  }

  let nearest: RecommendationStop | undefined;
  let nearestKm = Number.POSITIVE_INFINITY;
  for (const stop of stops) {
    const km = distanceKm(place, stop);
    if (km < nearestKm) { nearest = stop; nearestKm = km; }
  }
  if (nearest) score += WEIGHT.nearby * Math.exp(-nearestKm / WEIGHT.nearbyFalloffKm);

  const fillsGap = stops.length > 0 && candidate.category !== null
    && GAP_CATEGORIES.has(candidate.category) && !dayCategories.has(candidate.category);
  if (fillsGap) score += WEIGHT.gap;
  if (candidate.category === "stay") score += WEIGHT.stay;

  const reason: RecommendationReason = travelerCount !== undefined ? { kind: "popular", travelers: travelerCount }
    : nearest && nearestKm <= NEAR_KM && nearest.name.trim() ? { kind: "near", stopName: nearest.name.trim() }
    : fillsGap && candidate.category ? { kind: "gap", category: candidate.category }
    : { kind: "pick" };
  return { ...candidate, score, reason };
}

/**
 * Greedy selection with a diversity penalty (maximal marginal relevance), so
 * one category or one corner of the city cannot fill the whole shelf.
 */
function selectDiverse(scored: readonly Scored[], limit: number): Scored[] {
  const remaining = [...scored];
  const chosen: Scored[] = [];
  while (chosen.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestValue = Number.NEGATIVE_INFINITY;
    remaining.forEach((candidate, index) => {
      const repeats = candidate.category === null ? 0
        : chosen.filter((picked) => picked.category === candidate.category).length;
      const crowded = chosen.some((picked) => distanceKm(picked.recommendation.place, candidate.recommendation.place) <= SAME_AREA_KM);
      const value = candidate.score + WEIGHT.repeatCategory * repeats + (crowded ? WEIGHT.sameArea : 0);
      // Strictly greater keeps the earlier candidate on ties: count order, then guide order.
      if (value > bestValue) { bestValue = value; bestIndex = index; }
    });
    chosen.push(remaining.splice(bestIndex, 1)[0]);
  }
  return chosen;
}

const EMPTY_CONTEXT: RecommendationContext = { dayStops: [], plannedIds: new Set(), dayIndex: 0 };

/**
 * Merge real traveler evidence with curation without manufacturing popularity
 * for guide picks, then rank for this particular day: near its stops, filling
 * what it lacks, varied, and never repeating a place already in the trip.
 */
export function buildPlaceRecommendations(
  destination: TripDestination,
  guides: readonly DestinationGuide[],
  popularity?: PlacePopularityResponse,
  limit = 6,
  context: RecommendationContext = EMPTY_CONTEXT,
): PlaceRecommendation[] {
  const size = Math.max(0, Math.trunc(limit));
  if (size === 0) return [];
  const candidates = gatherCandidates(destination, guides, popularity, context, size);
  const stops = context.dayStops.filter((stop) => withinDestination(stop, destination));
  const dayCategories = new Set(stops.map((stop) => recommendationCategory(stop.placeType))
    .filter((category): category is RecommendationCategory => category !== null));
  const minimum = popularity?.minimumTravelers ?? 5;
  const scored = candidates.map((candidate) => scoreCandidate(candidate, stops, dayCategories, minimum));
  return selectDiverse(scored, size).map(({ recommendation, reason }) => ({ ...recommendation, reason }));
}

const GAP_TEXT: Record<RecommendationCategory, string> = {
  food: "Adds a meal",
  sight: "Adds a sight",
  nature: "Adds time outdoors",
  shopping: "Adds some shopping",
  nightlife: "Adds an evening out",
  stay: "Adds a place to stay",
};

/** The one-line reason under a card's name. */
export function describeRecommendation(reason: RecommendationReason): string {
  switch (reason.kind) {
    case "popular": return `Chosen by ${reason.travelers} travelers`;
    case "near": return `Near ${reason.stopName}`;
    case "gap": return GAP_TEXT[reason.category];
    case "pick": return "Navio pick";
  }
}
