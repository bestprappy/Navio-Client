import type { LegTravelMode } from "../constants/types";

export type RouteProfile =
  | "driving-traffic"
  | "driving"
  | "walking"
  | "cycling";

export type RoutePointType = "place" | "charger";

export type RouteCoordinate = [number, number];

export type RouteLineString = {
  type: "LineString";
  coordinates: RouteCoordinate[];
};

export type RoutePoint = {
  id: string;
  name: string;
  type: RoutePointType;
  lat: number;
  lng: number;
  /** How the leg ending here is travelled; omitted means drive. */
  arrivalMode?: LegTravelMode;
  /** Client selection metadata, removed before sending to Mobility. */
  arrivalRouteKey?: string;
  /** Transit between rail stations must contain rail rides and no bus rides. */
  railOnly?: boolean;
};

export type RoutePointGroup = {
  blockId: string;
  points: RoutePoint[];
};

export type DirectionsRequest = {
  profile?: RouteProfile;
  groups: RoutePointGroup[];
  includeTransitAlternatives?: boolean;
  transitRoutingPreference?: "FEWER_TRANSFERS" | "LESS_WALKING";
  departureTime?: string;
};

export type RouteSegmentStatus = "routed" | "fallback";

export type TransitLine = {
  name?: string | null;
  shortName?: string | null;
  /** Operator line colour as `#rrggbb`, when published. */
  color?: string | null;
  textColor?: string | null;
  /** Provider vehicle type, e.g. SUBWAY, HEAVY_RAIL, BUS. */
  vehicleType?: string | null;
};

/** One ride on a single line, or one walk, within a transit leg. */
export type RouteStep = {
  travelMode: LegTravelMode;
  geometry: RouteLineString;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  line?: TransitLine | null;
  departureStop?: string | null;
  arrivalStop?: string | null;
  stopCount?: number | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  headsign?: string | null;
  departureLocation?: RouteCoordinate | null;
  arrivalLocation?: RouteCoordinate | null;
};

export type TransitJourney = {
  id: string;
  provider: string;
  geometry: RouteLineString;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  walkingSeconds?: number | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  timeZone?: string | null;
  fare?: number | null;
  currency?: string | null;
  steps: RouteStep[];
};

export type RouteSegment = {
  id: string;
  blockId: string;
  fromItemId: string;
  toItemId: string;
  fromName: string;
  toName: string;
  status: RouteSegmentStatus;
  geometry: RouteLineString;
  // The mobility service sends these as JSON null (not omitted) when a segment
  // has no measured distance/duration or no fallback reason.
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  fallbackReason?: string | null;
  /** Absent from older mobility releases, which only drive. */
  travelMode?: LegTravelMode;
  steps?: RouteStep[];
  journeys?: TransitJourney[];
  /** Client-only: the saved line sequence was not offered, so the closest current journey is shown. */
  savedRouteUnavailable?: boolean;
};

export type DirectionsResponse = {
  segments: RouteSegment[];
};
