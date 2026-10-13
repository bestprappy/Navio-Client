import type { LegTravelMode } from "../constants/types";
import { isTransitMode } from "./leg-travel-mode";
import { getTransitJourneyScore, rankTransitJourneys } from "./transit-route-choice";
import { journeyAsSegment } from "./transit-journey.helpers";
import type { DirectionsRequest, RoutePoint, RouteSegment, RouteStep, TransitJourney } from "./trip-route.types";

export type TravelOptionKey = LegTravelMode;
export type TravelOption = { key: TravelOptionKey; segment: RouteSegment | null };

/** Compare just this connection, without inheriting another leg's mode or rail restriction. */
export function getTravelOptionRequests(
  blockId: string,
  from: RoutePoint,
  to: RoutePoint,
): { key: TravelOptionKey; request: DirectionsRequest }[] {
  const keys: TravelOptionKey[] = ["drive", "transit", "bike", "walk", "rail", "bus"];
  const requests = keys.map((key) => ({
    key,
    request: {
      profile: "driving-traffic" as const,
      groups: [{ blockId, points: [
        { id: from.id, name: from.name, type: from.type, lat: from.lat, lng: from.lng },
        { id: to.id, name: to.name, type: to.type, lat: to.lat, lng: to.lng,
          arrivalMode: key,
          ...(key === "rail" ? { railOnly: true } : {}) },
      ] }],
    },
  }));
  return [...requests, ...requests.filter(option => option.key === "rail" || option.key === "bus")
    .map(option => ({ ...option, request: { ...option.request, transitRoutingPreference: "FEWER_TRANSFERS" as const } }))];
}

export function isUsableTravelOption(option: TravelOption | undefined): boolean {
  if (!option?.segment || option.segment.status !== "routed") return false;
  const mode = option.segment.travelMode ?? "drive";
  const compatible = mode === option.key || ((option.key === "rail" || option.key === "bus") && mode === "transit");
  if (!compatible) return false;
  return option.key === "rail" || option.key === "bus"
    ? matchesTransitPreference(option.segment.steps ?? [], option.key) : true;
}

const RAIL_VEHICLES = new Set(["SUBWAY", "RAIL", "HEAVY_RAIL", "COMMUTER_TRAIN", "HIGH_SPEED_TRAIN", "LONG_DISTANCE_TRAIN", "METRO_RAIL", "MONORAIL", "TRAM"]);
const BUS_VEHICLES = new Set(["BUS", "INTERCITY_BUS", "TROLLEYBUS"]);

export function matchesTransitPreference(steps: RouteStep[], preference: "rail" | "bus"): boolean {
  const vehicles = preference === "rail" ? RAIL_VEHICLES : BUS_VEHICLES;
  return steps.some(step => step.travelMode === "transit") && steps.every(step => step.travelMode === "walk"
    || (step.travelMode === "transit" && vehicles.has(step.line?.vehicleType?.toUpperCase() ?? "")));
}

/** A balanced search retains metro transfers; a second search adds direct rides with more walking. */
export function mergeTravelOptionResults(options: TravelOption[]): TravelOption[] {
  const merged = new Map<TravelOptionKey, TravelOption>();
  for (const option of options) {
    const previous = merged.get(option.key);
    if (!previous || !isUsableTravelOption(previous)) { merged.set(option.key, option); continue; }
    if (!isUsableTravelOption(option) || !option.segment) continue;
    const journeys = rankTransitJourneys([...(previous.segment?.journeys ?? []), ...(option.segment.journeys ?? [])]);
    merged.set(option.key, { ...previous, segment: { ...previous.segment!, journeys } });
  }
  return combineTransitOptions([...merged.values()]);
}

/** The general result can omit rail even when a separate rail search confirms it. */
export function combineTransitOptions(options: TravelOption[]): TravelOption[] {
  const confirmed = options.filter(option => isTransitMode(option.key) && isUsableTravelOption(option));
  if (!confirmed.length) return options;
  const unique = new Map<string, TransitJourney>();
  for (const option of confirmed) {
    const segment = option.segment!;
    const journeys = segment.journeys?.length ? segment.journeys : [{ id: `${option.key}:primary`, provider: "unknown",
      geometry: segment.geometry, distanceMeters: segment.distanceMeters, durationSeconds: segment.durationSeconds,
      steps: segment.steps ?? [] }];
    for (const journey of journeys) {
      if ((option.key === "rail" || option.key === "bus") && !matchesTransitPreference(journey.steps, option.key)) continue;
      const rides = journey.steps.filter(step => step.travelMode === "transit");
      if (!rides.length) continue;
      const key = JSON.stringify(rides.map(step => [step.line?.vehicleType, step.line?.name, step.line?.shortName, step.departureStop, step.arrivalStop]));
      const previous = unique.get(key);
      if (!previous || getTransitJourneyScore(journey) < getTransitJourneyScore(previous)) unique.set(key, { ...journey, id: `${option.key}:${journey.id}` });
    }
  }
  const journeys = rankTransitJourneys([...unique.values()]);
  const source = confirmed.find(option => option.key === "transit")?.segment ?? confirmed[0].segment!;
  const transit = { ...source, travelMode: "transit" as const, journeys };
  return options.map(option => option.key === "transit" ? { ...option, segment: transit } : option);
}

/** A selection previews even when the provider only supplied a legacy primary route. */
export function getTravelOptionPreview(option: TravelOption, journeyId?: string | null): RouteSegment | null {
  if (!isUsableTravelOption(option) || !option.segment) return null;
  const journeys = option.segment.journeys ?? [];
  const journey = journeys.find(item => item.id === journeyId) ?? journeys[0];
  return journey ? journeyAsSegment(journey, option.segment) : option.segment;
}

export function getTransitVehicleLabel(step: RouteStep): string {
  const type = step.line?.vehicleType?.toUpperCase();
  if (type === "BUS" || type === "INTERCITY_BUS" || type === "TROLLEYBUS") return "Bus";
  if (type === "SUBWAY" || type === "METRO_RAIL") return "Metro";
  if (type === "TRAM") return "Tram";
  if (type === "FERRY") return "Ferry";
  if (type === "MONORAIL") return "Monorail";
  if (type && ["RAIL", "HEAVY_RAIL", "COMMUTER_TRAIN", "HIGH_SPEED_TRAIN", "LONG_DISTANCE_TRAIN"].includes(type)) return "Train";
  return "Public transit";
}

export function getTransitSummary(segment: RouteSegment): string | null {
  const rides = (segment.steps ?? []).filter((step) => step.travelMode === "transit");
  if (!rides.length || segment.status !== "routed") return null;
  const names = rides.map((ride) => ride.line?.name || ride.line?.shortName || getTransitVehicleLabel(ride));
  const transfers = rides.length - 1;
  return `${names.join(" → ")}${transfers ? ` · ${transfers} ${transfers === 1 ? "transfer" : "transfers"}` : " · Direct"}`;
}

export function getLegDirectionsUrl(from: RoutePoint, to: RoutePoint, mode: LegTravelMode): string {
  const params = new URLSearchParams({ api: "1", origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    travelmode: mode === "drive" ? "driving" : mode === "walk" ? "walking" : mode === "bike" ? "bicycling" : "transit" });
  return `https://www.google.com/maps/dir/?${params}`;
}

/** Use published operator colours, with an ink colour that is readable on that line. */
export function getLineTextColor(background: string): string {
  const raw = background.replace("#", "");
  const hex = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw;
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
