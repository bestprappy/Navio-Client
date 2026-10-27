import { format, isValid, parseISO } from "date-fns";
import type { ExplorePlan } from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { sharedDayColorId } from "../shared-plan-blocks";
import type { TripBlockColorId } from "../../../planId/_components/constants/types";
import type { PublicDay, PublicItem, PublicPlanSnapshot, SharedPlan } from "../publication-api";

/** Presentation-only additions. They are never read from the viewer's private planner. */
export type ReaderPresentation = {
  introduction?: string;
  cover?: { url: string; position?: string };
  vehicles?: { id: string; name: string; source: "catalog" | "custom"; batteryKwh?: number; rangeKm?: number; connectors: string[] }[];
  lists?: { title: string; items: PublicItem[] }[];
};
export type ReaderStop = { id: string; groupId: string; number: number; item: PublicItem; located: boolean };
export type ReaderGroup = {
  id: string; kind: "day" | "list"; label: string; title?: string; date?: string;
  colorId: TripBlockColorId; startsAt?: PublicDay["startsAt"]; endsAt?: PublicDay["endsAt"];
  entries: { id: string; item: PublicItem; stop?: ReaderStop }[]; stops: ReaderStop[];
};
export function readerDateLabel(value?: string): string | null {
  const date = value ? parseISO(value) : null;
  return date && isValid(date) ? format(date, "EEE, MMM d, yyyy") : null;
}
export function locatedItem(item: PublicItem): boolean {
  return typeof item.lat === "number" && Number.isFinite(item.lat) && Math.abs(item.lat) <= 90
    && typeof item.lng === "number" && Number.isFinite(item.lng) && Math.abs(item.lng) <= 180;
}
export function buildReaderModel(shared: SharedPlan, presentation: ReaderPresentation = {}) {
  const groups: ReaderGroup[] = [];
  function group(day: PublicDay, index: number, kind: "day" | "list"): ReaderGroup {
    const id = `shared-${kind}-${index + 1}`;
    const stops: ReaderStop[] = [];
    const entries = (day.items ?? []).map((item, itemIndex) => {
      const itemId = `${id}-item-${itemIndex + 1}`;
      const stop = item.type === "place" || item.type === "charger"
        ? { id: itemId, groupId: id, number: stops.length + 1, item, located: locatedItem(item) } : undefined;
      if (stop) stops.push(stop);
      return { id: itemId, item, stop };
    });
    return { id, kind, label: kind === "day" ? `Day ${index + 1}` : day.label, title: day.title, date: day.date,
      colorId: sharedDayColorId(day,index), entries, stops, startsAt: day.startsAt, endsAt: day.endsAt };
  }
  (presentation.lists ?? []).forEach((list, index) => groups.push(group({ label: list.title, items: list.items }, index, "list")));
  (shared.plan.days ?? []).forEach((day, index) => groups.push(group(day, index, "day")));
  const days = groups.filter(g => g.kind === "day");
  const stops = groups.flatMap(g => g.stops);
  const itineraryStops = days.flatMap(g => g.stops);
  const destination = [shared.plan.destinationCity, shared.plan.destinationCountry].filter(Boolean).join(", ");
  const title = shared.plan.title || destination || "A shared journey";
  const coverItem = itineraryStops.find(s => s.item.imageUrl)?.item ?? itineraryStops.find(s => s.item.placeId)?.item;
  const coverPlan: ExplorePlan = { token: "reader", title, authorName: shared.authorName,
    destinationCity: shared.plan.destinationCity, destinationCountry: shared.plan.destinationCountry,
    dayCount: shared.plan.dayCount, placeCount: itineraryStops.filter(s => s.item.type === "place").length,
    chargerCount: itineraryStops.filter(s => s.item.type === "charger").length,
    coverImageUrl: presentation.cover?.url ?? coverItem?.imageUrl, coverPlaceId: coverItem?.placeId,
    viewCount: shared.engagement?.viewCount, copyCount: shared.engagement?.copyCount,
    highlights: itineraryStops.slice(0, 3).map(s => s.item.name ?? ""), days: [],
  };
  return { groups, days, lists: groups.filter(g => g.kind === "list"), stops, title, destination, coverPlan, presentation };
}
export type ReaderModel = ReturnType<typeof buildReaderModel>;
export type ReaderCamera = { sequence: number; kind: "place"; stopId: string } | { sequence: number; kind: "overview" } | {sequence:number;kind:"leg";coordinates:[number,number][]};
export type ReaderSelection = { groupId: string | null; stopId: string | null; dismissed: boolean; camera: ReaderCamera | null };
export type ReaderAction = { type: "follow"; groupId: string } | { type: "select"; stopId: string }
  | { type: "step"; direction: -1 | 1 } | { type: "dismiss" } | { type: "zoom" } | { type: "overview" } | {type:"leg";coordinates:[number,number][]};
export function initialReaderSelection(groups: ReaderGroup[]): ReaderSelection {
  const group = groups.find(g => g.kind === "day") ?? groups[0];
  return { groupId: group?.id ?? null, stopId: group?.stops[0]?.id ?? null, dismissed: false, camera: null };
}
export function reduceReaderSelection(state: ReaderSelection, action: ReaderAction, groups: ReaderGroup[]): ReaderSelection {
  if (action.type === "dismiss") return { ...state, dismissed: true };
  if (action.type === "leg") return action.coordinates.length>=2?{...state,camera:{sequence:(state.camera?.sequence??0)+1,kind:"leg",coordinates:action.coordinates}}:state;
  if (action.type === "overview") return { ...state, camera: { sequence: (state.camera?.sequence ?? 0) + 1, kind: "overview" } };
  if (action.type === "follow") {
    const group = groups.find(g => g.id === action.groupId);
    return !group || group.id === state.groupId ? state : { ...state, groupId: group.id, stopId: group.stops[0]?.id ?? null };
  }
  if (action.type === "select") {
    const stop = groups.flatMap(g => g.stops).find(s => s.id === action.stopId);
    return stop ? { ...state, groupId: stop.groupId, stopId: stop.id, dismissed: false } : state;
  }
  const group = groups.find(g => g.id === state.groupId);
  const index = group?.stops.findIndex(s => s.id === state.stopId) ?? -1;
  if (action.type === "step") {
    const stop = group?.stops[Math.max(0, Math.min((group?.stops.length ?? 0) - 1, index + action.direction))];
    return stop ? { ...state, stopId: stop.id, dismissed: false } : state;
  }
  const stop = group?.stops[index];
  return stop?.located ? { ...state, camera: { sequence: (state.camera?.sequence ?? 0) + 1, kind: "place", stopId: stop.id } } : state;
}
export function groupReaderMarkers(groups: ReaderGroup[]) {
  const markers = new Map<string, { key: string; lat: number; lng: number; stops: ReaderStop[] }>();
  for (const stop of groups.flatMap(g => g.stops)) {
    if (!stop.located) continue;
    const lat = stop.item.lat!, lng = stop.item.lng!;
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const marker = markers.get(key) ?? { key, lat, lng, stops: [] };
    marker.stops.push(stop); markers.set(key, marker);
  }
  return [...markers.values()];
}
export function rankRelatedPlans<T extends Pick<ExplorePlan, "token" | "destinationCity" | "destinationCountry" | "dayCount">>(plans: T[], token: string, plan: PublicPlanSnapshot): T[] {
  const normalize = (value?: string | null) => value?.trim().toLocaleLowerCase() ?? "";
  const country = normalize(plan.destinationCountry), city = normalize(plan.destinationCity);
  const seen = new Set<string>([token]);
  const candidates = plans.filter(p => {
    if (seen.has(p.token) || !country || normalize(p.destinationCountry) !== country) return false;
    seen.add(p.token); return true;
  });
  return candidates.sort((a, b) => Number(normalize(b.destinationCity) === city) - Number(normalize(a.destinationCity) === city)
    || Math.abs(a.dayCount - plan.dayCount) - Math.abs(b.dayCount - plan.dayCount)).slice(0, 6);
}
