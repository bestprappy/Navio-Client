import type { ExpenseItem } from "../../../app/feature/planner/planId/_components/budget/budget.types";
import type { TripBlockData } from "../../../app/feature/planner/planId/_components/constants/types";
import type { ItineraryTableAnchors } from "../../../app/feature/planner/planId/_components/itinerary/export/itinerary-table";

const place = { type: "place" as const, lat: 13.74, lng: 100.49 };

export const dayTwo: TripBlockData = {
  id: "day-two",
  kind: "itinerary",
  title: "",
  date: "2026-12-23",
  colorId: "amber",
  items: [
    { ...place, id: "market", placeId: "GOOGLE:market", name: "Chatuchak Market", address: "Kamphaeng Phet 2 Rd", cost: 450 },
  ],
};

export const dayOne: TripBlockData = {
  id: "day-one",
  kind: "itinerary",
  title: "",
  date: "2026-12-22",
  colorId: "teal",
  items: [
    { ...place, id: "wat-arun", placeId: "GOOGLE:wat-arun", name: "Wat Arun", address: "158 Thanon Wang Doem", time: "09:00", timeEnd: "10:30", notes: "Cover shoulders, \"no shorts\"" },
    { id: "note-1", type: "note", content: "Buy a SIM card" },
    { id: "list-1", type: "checklist", title: "Packing", items: [{ id: "p1", label: "Passport", checked: false }] },
    { ...place, id: "jay-fai", placeId: "GOOGLE:jay-fai", name: "Jay Fai", address: "327 Maha Chai Rd", time: "12:00", notes: "=HYPERLINK(\"http://example.test\")" },
    {
      ...place,
      id: "charger",
      placeId: "ev-charger:ptt-1",
      name: "PTT EV Station",
      address: "Rama IV Rd",
      evCharger: {
        connectorTypes: ["CCS2"],
        maxKw: 120,
        totalConnectors: 4,
        availableConnectors: null,
        priceText: null,
        openingHoursSummary: null,
        estimatedChargeMinutes: 44.6,
        targetBatteryPct: 80,
        operatorName: "PTT",
      },
    },
  ],
};

export const listBlock: TripBlockData = {
  id: "saved-list",
  kind: "list",
  title: "Restaurants",
  date: "",
  colorId: "rose",
  items: [{ ...place, id: "saved", placeId: "GOOGLE:saved", name: "Saved cafe", address: "" }],
};

export const expenses: ExpenseItem[] = [
  { id: "place-expense-jay-fai/expense-1", amount: 1000, label: "Crab omelette", categoryId: "food" },
  { id: "place-expense-jay-fai/expense-2", amount: 120.5, label: "Drinks", categoryId: "drinks" },
  { id: "unlinked-expense", amount: 9999, label: "Flight", categoryId: "flights" },
];

export const anchors = new Map<string, ItineraryTableAnchors>([
  ["day-one", { start: { name: "Suvarnabhumi Airport", address: "Bang Phli" }, end: { name: "Riva Hotel" } }],
  ["day-two", { start: { name: "Riva Hotel" }, end: null }],
]);
