import type { TripResponse } from "./planner-api";
import type { TripBlockData } from "../planId/_components/constants/types";

export function getTripCountry(trip: Pick<TripResponse, "destinationCountry" | "destinationName">): string {
  if (trip.destinationCountry?.trim()) return trip.destinationCountry.trim();
  const parts = trip.destinationName.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) return parts.at(-1)!;
  // Compatibility for older trips that were saved before country metadata.
  if (/bangkok|chiang mai|chiang rai|hua hin|huahin|phuket|krabi|pattaya|thailand/i.test(trip.destinationName)) return "Thailand";
  if (/bangalore|bengaluru|mumbai|new delhi|india/i.test(trip.destinationName)) return "India";
  return "Your trip";
}

export function getTripDisplayName(trip: Pick<TripResponse, "displayName" | "destinationName" | "destinationCountry">): string {
  const country = getTripCountry(trip);
  return (!trip.displayName || trip.displayName === `Trip to ${trip.destinationName}`) && country !== "Your trip"
    ? country : trip.displayName || country;
}

export function getTripDestinations(initial: string, blocks: readonly TripBlockData[]): string[] {
  const days = blocks.filter((block) => block.kind === "itinerary").toSorted((a, b) => a.date.localeCompare(b.date));
  return [...new Set([days[0]?.destination?.name || initial, ...days.flatMap((day) => day.destination ? [day.destination.name] : [])])].filter(Boolean);
}
