import type { TripBlockData } from "../../../app/feature/planner/planId/_components/constants/types";

export const planId = "a1000000-0000-4000-8000-000000000061";
export const userId = "22222222-2222-4222-8222-222222222222";
export const day: TripBlockData = {
  id: "tokyo-day", kind: "itinerary", title: "Tokyo", date: "2026-10-13", colorId: "brick",
  items: [
    { id: "shinjuku", type: "place", placeId: "GOOGLE:shinjuku-fixture", name: "Shinjuku City",
      address: "Tokyo, Japan", lat: 35.6938, lng: 139.7034, placeType: "locality" },
    { id: "skytree", type: "place", placeId: "GOOGLE:skytree-fixture", name: "Tokyo Skytree",
      address: "Tokyo, Japan", lat: 35.7101, lng: 139.8107, placeType: "tourist_attraction", arrivalMode: "transit" },
  ],
};
export const towerDay: TripBlockData = {
  ...day,
  items: [
    { id: "tower", type: "place", placeId: "GOOGLE:tower-fixture", name: "Tokyo Tower",
      address: "Tokyo, Japan", lat: 35.65858, lng: 139.74543, placeType: "tourist_attraction" },
    { id: "shinjuku", type: "place", placeId: "GOOGLE:shinjuku-fixture", name: "Shinjuku City",
      address: "Tokyo, Japan", lat: 35.6938, lng: 139.7034, placeType: "locality", arrivalMode: "transit" },
  ],
};
export const trip = {
  id: planId, displayName: "Tokyo transit check", title: "Tokyo transit check", destinationId: "tokyo-fixture",
  destinationName: "Tokyo", destinationCountry: "Japan", destinationCountryCode: "JP",
  destinationLat: 35.6938, destinationLng: 139.7034, startDate: "2026-10-13", endDate: "2026-10-13", visibility: "PRIVATE",
};
export const account = { id: userId, displayName: "Test traveller", email: "traveller@example.invalid", locale: "en", countryCode: "JP", roles: ["USER"] };
export const capabilities = ["leg-travel-mode-v1", "cycling-legs-v1", "transit-preferences-v1", "transit-route-choice-v1",
  "trip-energy-v1", "trip-garage-v1", "observed-soc-v1", "day-destinations", "day-anchors", "charge-targets", "precise-charging-v1"];
