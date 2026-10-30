import type { NoteItem, PlaceItem, TripAnchor, TripBlockData } from "../../../app/feature/planner/planId/_components/constants/types";

export const hotel: PlaceItem = {
  id: "hotel", type: "place", placeId: "GOOGLE:ChIHotel", name: "Hotel Nikko",
  address: "Tokyo, Japan", lat: 35.68, lng: 139.76, placeType: "hotel",
  time: "09:00", notes: "Check out before nine", schedule: [{ id: "checkout", time: "09:00", label: "Check out" }],
  isVisited: false,
};
export const temple: PlaceItem = {
  id: "temple", type: "place", placeId: "GOOGLE:ChITemple", name: "Senso-ji",
  address: "Tokyo, Japan", lat: 35.71, lng: 139.79, placeType: "tourist_attraction", isVisited: false,
};
export const ryokan: PlaceItem = {
  id: "ryokan", type: "place", placeId: "GOOGLE:ChIRyokan", name: "Ryokan Asakusa",
  address: "Tokyo, Japan", lat: 35.72, lng: 139.8, placeType: "lodging", time: "18:30", isVisited: false,
};
export const market: PlaceItem = {
  id: "market", type: "place", placeId: "GOOGLE:ChIMarket", name: "Ameyoko Market",
  address: "Tokyo, Japan", lat: 35.7, lng: 139.77, placeType: "market", isVisited: false,
};
export const charger: PlaceItem = {
  id: "charger", type: "place", placeId: "ev-charger:station-1", name: "Fast charger",
  address: "Tokyo, Japan", lat: 35.69, lng: 139.78, isVisited: false,
};
export const packingNote: NoteItem = { id: "note", type: "note", content: "Pack the car" };

export const home: TripAnchor = { id: "home", kind: "SAVED_PLACE", name: "Home", lat: 35.6, lng: 139.6 };

/** Day one starts from home and visits a hotel, a temple and a ryokan. */
export const firstDay: TripBlockData = {
  id: "day-1", kind: "itinerary", title: "Day 1", date: "2026-11-01", colorId: "teal",
  startAnchor: home,
  items: [hotel, temple, ryokan],
};
export const secondDay: TripBlockData = {
  id: "day-2", kind: "itinerary", title: "Day 2", date: "2026-11-02", colorId: "blue",
  items: [market],
};
