import type { PlaceItem, TripBlockData } from "../../../app/feature/planner/planId/_components/constants/types";
import { arrivalDay, hotel, museum } from "../repeat-visits/data";
import { getAllEvChargers } from "../../../app/feature/planner/planId/_components/constants/charger.data";

export const charger = getAllEvChargers()[0];

export const longDay: TripBlockData = {
  ...arrivalDay,
  startAnchor: null,
  endAnchor: null,
  items: Array.from({ length: 50 }, (_, index): PlaceItem => ({
    ...museum, id: `stop-${index + 1}`, placeId: `GOOGLE:ChIStop${index + 1}`, name: `Place ${index + 1}`,
  })),
};

export const secondDay: TripBlockData = { ...longDay, id: "second-day", date: "2026-10-13", items: [hotel] };
export const searchedPlace = {
  id: museum.placeId, provider: "GOOGLE" as const, providerPlaceId: "ChIMuseum", name: museum.name,
  address: museum.address, lat: museum.lat, lng: museum.lng, primaryType: "museum",
};

export const mixedDay: TripBlockData = {
  ...arrivalDay,
  items: [
    hotel,
    { id: "note", type: "note", content: "Lunch reservation" },
    { ...museum, id: "charger", placeId: "ev-charger:station-1", name: "Charging station" },
    museum,
    { id: "checklist", type: "checklist", title: "Packing", items: [] },
  ],
};
