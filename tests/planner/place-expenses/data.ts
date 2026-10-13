import type { ExpenseItem } from "../../../app/feature/planner/planId/_components/budget/budget.types";
import type { PlaceItem, TripBlockData } from "../../../app/feature/planner/planId/_components/constants/types";

export const memorial: PlaceItem = {
  id: "memorial-visit", type: "place", placeId: "GOOGLE:memorial", name: "Chiang Kai-shek Memorial Hall",
  address: "Zhongzheng District, Taipei City, Taiwan 100", lat: 25.034, lng: 121.521,
  placeType: "historical_landmark", time: "09:30", timeEnd: "13:00",
  rating: 4.5, reviewCount: 82700,
};
export const returnVisit: PlaceItem = { ...memorial, id: "memorial-return", name: "Memorial Hall return", time: undefined, timeEnd: undefined };
export const day: TripBlockData = {
  id: "day", kind: "itinerary", title: "Day 1", date: "2026-12-22", colorId: "amber", items: [memorial, returnVisit],
};
export const lunch: ExpenseItem = {
  id: "place-cost-memorial-visit", amount: 260, label: "Dan-Dan Noodles", categoryId: "food", date: day.date,
};
export const unlinked: ExpenseItem = { id: "expense-taxi", amount: 75, label: "Airport taxi", categoryId: "transit", date: day.date };
