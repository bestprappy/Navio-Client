import type { PlaceItem, TripBlockData } from "../../../app/feature/planner/planId/_components/constants/types";
import type { RoutePoint, RouteSegment, TransitJourney } from "../../../app/feature/planner/planId/_components/routes/trip-route.types";

export const origin: RoutePoint = { id: "victory", name: "Victory Monument", type: "place", lat: 13.762, lng: 100.537 };
export const destination: RoutePoint = { id: "ratchadamri", name: "Ratchadamri", type: "place", lat: 13.739, lng: 100.54, arrivalMode: "transit", railOnly: true };
const station = (point: RoutePoint): PlaceItem => ({ ...point, type: "place", placeId: `GOOGLE:${point.id}`, address: "Bangkok, Thailand", placeType: "subway_station", arrivalMode: undefined });
export const journeyDay: TripBlockData = { id: "journey-day", kind: "itinerary", title: "Bangkok", date: "2026-10-13", colorId: "brick", items: [station(origin), station(destination)] };
export const railRoute: RouteSegment = {
  id: "leg", blockId: journeyDay.id, fromItemId: origin.id, toItemId: destination.id, fromName: origin.name, toName: destination.name,
  status: "routed", travelMode: "transit", geometry: { type: "LineString", coordinates: [[100.537, 13.762], [100.54, 13.739]] }, distanceMeters: 3400, durationSeconds: 900,
  steps: [
    { travelMode: "walk", geometry: { type: "LineString", coordinates: [[100.537, 13.762], [100.538, 13.763]] }, distanceMeters: 90, durationSeconds: 120 },
    { travelMode: "transit", geometry: { type: "LineString", coordinates: [[100.538, 13.763], [100.534, 13.745]] }, durationSeconds: 480, departureStop: "Victory Monument", arrivalStop: "Siam", stopCount: 4,
      line: { name: "BTS Sukhumvit Line", shortName: "BTS", color: "#71BF45", vehicleType: "HEAVY_RAIL" } },
    { travelMode: "transit", geometry: { type: "LineString", coordinates: [[100.534, 13.745], [100.54, 13.739]] }, durationSeconds: 300, departureStop: "Siam", arrivalStop: "Ratchadamri", stopCount: 1,
      line: { name: "BTS Silom Line", shortName: "BTS", color: "#008C95", vehicleType: "HEAVY_RAIL" } },
  ],
};

export const scheduledJourneys: TransitJourney[] = [
  { id: "route-1", provider: "GOOGLE", geometry: railRoute.geometry, distanceMeters: 3400, durationSeconds: 1200, walkingSeconds: 300,
    departureTime: "2026-10-13T02:03:00Z", arrivalTime: "2026-10-13T02:23:00Z", timeZone: "Asia/Bangkok", fare: 47, currency: "THB",
    steps: railRoute.steps!.map((step, index) => index === 1 ? { ...step, departureTime: "2026-10-13T02:05:00Z", arrivalTime: "2026-10-13T02:13:00Z", headsign: "Kheha", departureLocation: [100.538, 13.763], arrivalLocation: [100.534, 13.745] }
      : index === 2 ? { ...step, departureTime: "2026-10-13T02:17:00Z", arrivalTime: "2026-10-13T02:22:00Z", headsign: "Bang Wa", departureLocation: [100.534, 13.745], arrivalLocation: [100.54, 13.739] } : step) },
  { id: "route-2", provider: "GOOGLE", geometry: { type: "LineString", coordinates: [[100.537, 13.762], [100.545, 13.75], [100.54, 13.739]] }, distanceMeters: 4100, durationSeconds: 1500, walkingSeconds: 300,
    departureTime: "2026-10-13T02:07:00Z", arrivalTime: "2026-10-13T02:32:00Z", timeZone: "Asia/Bangkok", fare: null, currency: null,
    steps: [railRoute.steps![0], { ...railRoute.steps![1], departureStop: "Alternative station", arrivalStop: "Ratchadamri", line: { name: "MRT Blue Line", color: "#1769BA", vehicleType: "SUBWAY" }, departureLocation: [100.545, 13.75], arrivalLocation: [100.54, 13.739] }] },
];
