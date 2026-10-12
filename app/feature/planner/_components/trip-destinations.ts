import type { TripBlockData } from "../planId/_components/constants/types";
import type { ExplorePlan } from "../../explore/_components/shared-plans/explore-plans-api";

export const MAX_PLANNER_EXPLORE_PLANS = 10;
export const MAX_PLANNER_EXPLORE_DESTINATIONS = 10;

export function getTripDestinations(initial: string, blocks: readonly TripBlockData[]): string[] {
  const days = blocks.filter((block) => block.kind === "itinerary").toSorted((a, b) => a.date.localeCompare(b.date));
  return [...new Set([days[0]?.destination?.name || initial, ...days.flatMap((day) => day.destination ? [day.destination.name] : [])])].filter(Boolean);
}

function normalizeDestination(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function destinationPlaceKey(value: string): string {
  return normalizeDestination(value.split(",")[0] ?? "");
}

export function getPlannerExploreDestinations(destinations: readonly string[]): string[] {
  const visible: string[] = [];
  const seen = new Set<string>();
  for (const destination of destinations) {
    const label = destination.trim();
    const key = destinationPlaceKey(label);
    if (!key || seen.has(key)) continue;
    visible.push(label);
    seen.add(key);
    if (visible.length === MAX_PLANNER_EXPLORE_DESTINATIONS) break;
  }
  return visible;
}

function planMatchesDestination(plan: ExplorePlan, destination: string): boolean {
  const tripPlace = destinationPlaceKey(destination);
  if (!tripPlace) return false;
  return [plan.destinationCity, plan.destinationCountry]
    .filter((value): value is string => Boolean(value))
    .some((value) => normalizeDestination(value) === tripPlace);
}

export function selectPlannerExplorePlans(
  destinations: readonly string[],
  plans: readonly ExplorePlan[],
): ExplorePlan[] {
  const selectedDestinations = getPlannerExploreDestinations(destinations);
  if (selectedDestinations.length === 0) return [];

  const buckets = selectedDestinations.map(() => [] as ExplorePlan[]);
  const assignedTokens = new Set<string>();
  for (const plan of plans) {
    if (assignedTokens.has(plan.token)) continue;
    const destinationIndex = selectedDestinations.findIndex((destination) =>
      planMatchesDestination(plan, destination),
    );
    if (destinationIndex < 0) continue;
    buckets[destinationIndex].push(plan);
    assignedTokens.add(plan.token);
  }

  const selected: ExplorePlan[] = [];
  for (let round = 0; selected.length < MAX_PLANNER_EXPLORE_PLANS; round += 1) {
    let addedInRound = false;
    for (const bucket of buckets) {
      const plan = bucket[round];
      if (!plan) continue;
      selected.push(plan);
      addedInRound = true;
      if (selected.length === MAX_PLANNER_EXPLORE_PLANS) break;
    }
    if (!addedInRound) break;
  }
  return selected;
}
