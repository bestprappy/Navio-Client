import type { RouteSegment } from "../../../app/feature/planner/planId/_components/routes/trip-route.types";

const line = (coordinates: [number, number][]) => ({ type: "LineString" as const, coordinates });

/** Day 1: Start (airport) -> Taipei Main -> Ximen -> End (hotel). Day 2 has one leg. */
export const airportToTaipei: RouteSegment = {
  id: "seg-1",
  blockId: "day-1",
  fromItemId: "day-1:start",
  toItemId: "taipei-main",
  fromName: "Airport Terminal 2",
  toName: "Taipei Main Station",
  status: "routed",
  geometry: line([[121.23, 25.08], [121.4, 25.03], [121.517, 25.047]]),
};

export const taipeiToXimen: RouteSegment = {
  id: "seg-2",
  blockId: "day-1",
  fromItemId: "taipei-main",
  toItemId: "ximen",
  fromName: "Taipei Main Station",
  toName: "Ximen",
  status: "routed",
  geometry: line([[121.517, 25.047], [121.507, 25.042]]),
};

export const ximenToHotel: RouteSegment = {
  id: "seg-3",
  blockId: "day-1",
  fromItemId: "ximen",
  toItemId: "day-1:end",
  fromName: "Ximen",
  toName: "Hotel",
  status: "fallback",
  geometry: line([[121.507, 25.042], [121.52, 25.05]]),
};

/** Day 2 has no Start anchor, so its first leg leaves its first place. */
export const beitouToTamsui: RouteSegment = {
  id: "seg-4",
  blockId: "day-2",
  fromItemId: "beitou",
  toItemId: "tamsui",
  fromName: "Beitou",
  toName: "Tamsui",
  status: "routed",
  geometry: line([[121.5, 25.13], [121.44, 25.17]]),
};

export const allSegments: RouteSegment[] = [airportToTaipei, taipeiToXimen, ximenToHotel, beitouToTamsui];

/** Greater Taipei at city zoom. */
export const taipeiView = { west: 121.2, south: 24.95, east: 121.7, north: 25.25 };
