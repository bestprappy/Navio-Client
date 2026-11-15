import { isPlaceItem, type TripBlockData, type TripBlockItem } from "../constants/types";
import type { RouteSegment } from "../routes/trip-route.types";

export type RouteStrategy = "backtracking" | "distance" | "time";
export function movable(item: TripBlockItem, flexible: boolean): boolean {
  return isPlaceItem(item) && !item.isVisited && !item.observedSocCheckpoint
    && !item.time && !item.timeEnd && !item.schedule?.length && !item.notes
    && !item.arrivalRouteKey && (!item.arrivalMode || item.arrivalMode === "drive")
    && (!item.evCharger || (flexible && !item.evCharger.locked));
}

/** Only swap inside contiguous unconstrained sections. Day endpoints stay fixed. */
export function dayOrderCandidates(day: TripBlockData, flexible: boolean): TripBlockData[] {
  const candidates: TripBlockData[] = [];
  for (let from = 1; from < day.items.length - 2; from++) {
    if (!movable(day.items[from], flexible)) continue;
    for (let to = from + 1; to < day.items.length - 1; to++) {
      if (!movable(day.items[to], flexible)) break;
      const items = [...day.items];
      [items[from], items[to]] = [items[to], items[from]];
      candidates.push({ ...day, items });
      if (candidates.length === 32) return candidates;
    }
  }
  return candidates;
}

export function routeMetrics(segments: RouteSegment[]) {
  if (!segments.length || segments.some(s => s.status !== "routed" || s.distanceMeters == null || s.durationSeconds == null || (s.travelMode && s.travelMode !== "drive"))) return null;
  const edges = new Map<string, number>();
  let repeatedMeters = 0;
  for (const segment of segments) {
    const points = segment.geometry.coordinates;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const key = [a.map(v => v.toFixed(4)).join(","), b.map(v => v.toFixed(4)).join(",")].sort().join("|");
      const meters = Math.hypot((a[0] - b[0]) * Math.cos(a[1] * Math.PI / 180), a[1] - b[1]) * 111_195;
      if (edges.has(key)) repeatedMeters += meters;
      edges.set(key, meters);
    }
  }
  return { distanceMeters: segments.reduce((n, s) => n + s.distanceMeters!, 0), seconds: segments.reduce((n, s) => n + s.durationSeconds!, 0), repeatedMeters };
}
export type RouteMetrics = NonNullable<ReturnType<typeof routeMetrics>>;
export function routeScore(metrics: RouteMetrics, strategy: RouteStrategy) {
  return strategy === "time" ? metrics.seconds : strategy === "distance" ? metrics.distanceMeters : metrics.distanceMeters + 3 * metrics.repeatedMeters;
}
export function meaningfulImprovement(before: RouteMetrics, after: RouteMetrics, strategy: RouteStrategy) {
  const saving = routeScore(before, strategy) - routeScore(after, strategy);
  return saving >= Math.max(routeScore(before, strategy) * 0.02, strategy === "time" ? 60 : 250);
}
