import type {
  TripBlockData,
  TripDestination,
} from "../planner/planId/_components/constants/types";
import type { GuideDiscoveryFilter } from "./user-guides-api";
import { countryCodeFromName } from "../admin/_components/guides/guide-model";

export type TripGuideDestination = {
  key: string;
  name: string;
  country?: string;
  filter: GuideDiscoveryFilter;
};

/** Resolve all chronological cities before grouping their guide discovery by country. */
export function tripGuideDestinations(
  initial: string,
  blocks: readonly TripBlockData[],
  initialCountry?: string,
): TripGuideDestination[] {
  const days = blocks
    .filter((block) => block.kind === "itinerary")
    .toSorted((a, b) => a.date.localeCompare(b.date));
  const knownCountry =
    initialCountry?.trim() && initialCountry !== "Your trip"
      ? initialCountry.trim()
      : undefined;
  const fallback: TripDestination = {
    id: "",
    name: initial,
    lat: 0,
    lng: 0,
    country: knownCountry,
  };
  let current = fallback;
  const entries = days.map((day) => {
    current = day.destination ?? current;
    return current;
  });
  if (!entries.length && initial.trim()) entries.push(fallback);
  const seen = new Set<string>();
  return entries.flatMap((destination) => {
    const name = destination.name.split(",")[0].trim();
    if (!name) return [];
    const providerId = /^(GOOGLE|MAPBOX):[A-Za-z0-9_-]{1,255}$/.test(
      destination.id,
    )
      ? destination.id
      : /^ChIJ[A-Za-z0-9_-]+$/.test(destination.id)
        ? `GOOGLE:${destination.id}`
        : null;
    const country =
      destination.country?.trim() ||
      (name.toLocaleLowerCase() ===
      initial.split(",")[0].trim().toLocaleLowerCase()
        ? knownCountry
        : undefined);
    const key = providerId ?? `${name.toLocaleLowerCase()}|${country ?? ""}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        key,
        name,
        country,
        filter: {
          ...(providerId
            ? { destinations: [providerId] }
            : { cities: [name], country }),
          size: 3,
        },
      },
    ];
  });
}

/** A Japan trip includes country-wide, Tokyo, Osaka and every other published Japan guide. */
export function tripGuideDiscoveryScopes(
  initial: string,
  blocks: readonly TripBlockData[],
  initialCountry?: string,
): TripGuideDestination[] {
  const seen = new Set<string>();
  return tripGuideDestinations(initial, blocks, initialCountry).flatMap(
    (destination) => {
      if (!destination.country) return [destination];
      const code = /^[A-Za-z]{2}$/.test(destination.country)
        ? destination.country.toUpperCase()
        : countryCodeFromName(destination.country);
      const key = `country:${code ?? destination.country.toLocaleLowerCase()}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const name = code
        ? (new Intl.DisplayNames(["en"], { type: "region" }).of(code) ??
          destination.country)
        : destination.country;
      return [{ key, name, country: name, filter: { country: name, size: 3 } }];
    },
  );
}
