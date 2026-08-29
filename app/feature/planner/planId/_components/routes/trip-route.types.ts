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
};

export type RoutePointGroup = {
  blockId: string;
  points: RoutePoint[];
};

export type DirectionsRequest = {
  profile?: RouteProfile;
  groups: RoutePointGroup[];
};

export type RouteSegmentStatus = "routed" | "fallback";

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
};

export type DirectionsResponse = {
  segments: RouteSegment[];
};
