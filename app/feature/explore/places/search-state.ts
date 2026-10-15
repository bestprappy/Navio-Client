import type { DiscoveryItem } from "./places-api";

// ISO 3166-1 alpha-2, including territories. Display names come from the platform's CLDR data.
const codes =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const countries = codes
  .map((code) => ({ code, name: names.of(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));
export const interests = [
  { id: "popular", label: "Popular places" },
  { id: "hidden-gems", label: "Hidden gems" },
  { id: "indoor", label: "Indoor" },
  { id: "scenic", label: "Scenic spots" },
  { id: "food", label: "Food & cafés" },
  { id: "things-to-do", label: "Things to do" },
] as const;
export const placeTypes = [
  { id: "restaurant", label: "Restaurant" },
  { id: "cafe", label: "Café" },
  { id: "bakery", label: "Bakery" },
  { id: "hotel", label: "Hotel" },
  { id: "museum", label: "Museum" },
  { id: "art_gallery", label: "Art gallery" },
  { id: "park", label: "Park" },
  { id: "botanical_garden", label: "Botanical garden" },
  { id: "aquarium", label: "Aquarium" },
  { id: "amusement_park", label: "Amusement park" },
  { id: "tourist_attraction", label: "Tourist attraction" },
] as const;
export const seasons = [
  { id: "spring", label: "Spring" },
  { id: "summer", label: "Summer" },
  { id: "autumn", label: "Autumn" },
  { id: "winter", label: "Winter" },
  { id: "wet", label: "Wet season" },
  { id: "dry", label: "Dry season" },
] as const;
export const months = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2026, i, 1)),
  ),
);
export type PlaceSearchState = {
  country: string;
  query: string;
  interests: string[];
  types: string[];
  time: string;
};
export function parsePlaceSearch(params: URLSearchParams): PlaceSearchState {
  const unique = (key: string, allowed: readonly { id: string }[]) => [
    ...new Set(
      params.getAll(key).filter((v) => allowed.some((a) => a.id === v)),
    ),
  ];
  const country = (params.get("country") || "").toUpperCase();
  const legacy = Number(params.get("month"));
  const time =
    params.get("time") ??
    (Number.isInteger(legacy) && legacy >= 1 && legacy <= 12
      ? `month:${legacy}`
      : "any");
  const validTime =
    /^month:([1-9]|1[0-2])$/.test(time) ||
    seasons.some((s) => time === `season:${s.id}`);
  const legacyInterest = interests.find(
    (i) => i.id === params.get("collection"),
  );
  return {
    country: codes.includes(country) ? country : "",
    query: (params.get("placesQuery") || "").trim().slice(0, 200),
    interests: params.has("interest")
      ? unique("interest", interests)
      : legacyInterest
        ? [legacyInterest.id]
        : [],
    types: unique("type", placeTypes),
    time: validTime ? time : "any",
  };
}
export function updatePlaceSearch(
  params: URLSearchParams,
  changes: Partial<PlaceSearchState>,
) {
  const next = new URLSearchParams(params);
  for (const key of ["cursor", "collection", "month"]) next.delete(key);
  if ("country" in changes || "query" in changes)
    for (const key of ["destination", "lat", "lng"]) next.delete(key);
  const state = { ...parsePlaceSearch(params), ...changes };
  next.set("tab", "places");
  next.set("country", state.country);
  next.set("time", state.time);
  if (state.query) next.set("placesQuery", state.query);
  else next.delete("placesQuery");
  for (const [key, values] of [
    ["interest", state.interests],
    ["type", state.types],
  ] as const) {
    next.delete(key);
    for (const value of values) next.append(key, value);
  }
  return next;
}
export function resultMode(state: PlaceSearchState) {
  return !!state.query || state.types.length > 0;
}
export function timeLabel(time: string) {
  if (time.startsWith("month:"))
    return `Month: ${months[Number(time.slice(6)) - 1]}`;
  return seasons.find((s) => time === `season:${s.id}`)
    ? `Season: ${seasons.find((s) => time === `season:${s.id}`)!.label}`
    : "Any time";
}
export function partitionPlaces(
  items: DiscoveryItem[],
  eligibleIds: string[],
  columns: number,
) {
  const unique = [
    ...new Map(items.map((i) => [i.place.providerPlaceId, i])).values(),
  ];
  const eligible = eligibleIds
    .map((id) => unique.find((i) => i.place.providerPlaceId === id))
    .filter((i): i is DiscoveryItem => !!i);
  const recommendations =
    eligible.length >= columns * 2 ? eligible.slice(0, columns * 5) : [];
  const displayed = new Set(
    recommendations.map((i) => i.place.providerPlaceId),
  );
  return {
    recommendations,
    matches: unique.filter((i) => !displayed.has(i.place.providerPlaceId)),
  };
}
