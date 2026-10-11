import type { PlaceItem, PlaceSearchResult, TripBlockData } from "../../../app/feature/planner/planId/_components/constants/types";

export const hotel: PlaceItem = {
  id: "hotel-check-in", type: "place", placeId: "GOOGLE:ChIHotel", name: "River Hotel",
  address: "Bangkok, Thailand", lat: 13.75, lng: 100.5, placeType: "hotel", description: "Hotel",
  notes: "Check in and leave bags", time: "11:00", cost: 2400, isVisited: true,
  observedSocCheckpoint: { socPct: 70 }, arrivalMode: "walk",
};
export const museum: PlaceItem = {
  id: "museum", type: "place", placeId: "GOOGLE:ChIMuseum", name: "City Museum",
  address: "Bangkok, Thailand", lat: 13.76, lng: 100.52, placeType: "museum", isVisited: false,
};
export const hotelSearch: PlaceSearchResult = {
  id: hotel.placeId, provider: "GOOGLE", providerPlaceId: "ChIHotel", name: hotel.name,
  address: hotel.address, lat: hotel.lat, lng: hotel.lng, primaryType: "hotel",
};
export const arrivalDay: TripBlockData = {
  id: "arrival-day", kind: "itinerary", title: "Arrival", date: "2026-10-12", colorId: "teal",
  startAnchor: { id: "ChIAirport", kind: "PLACE", name: "Airport", lat: 13.7, lng: 100.6 },
  endAnchor: { id: "ChIHotel", kind: "PLACE", name: hotel.name, address: hotel.address, lat: hotel.lat, lng: hotel.lng },
  items: [hotel, museum],
};
export const followingDay: TripBlockData = {
  id: "following-day", kind: "itinerary", title: "City day", date: "2026-10-13", colorId: "blue", items: [],
};
export const stationA: PlaceItem = {
  id: "station-a-out", type: "place", placeId: "GOOGLE:ChIStationA", name: "Station A",
  address: "Bangkok, Thailand", lat: 13.75, lng: 100.5, placeType: "subway_station", isVisited: false,
};
export const stationB: PlaceItem = {
  ...stationA, id: "station-b-out", placeId: "GOOGLE:ChIStationB", name: "Station B", lat: 13.76, lng: 100.52,
};
