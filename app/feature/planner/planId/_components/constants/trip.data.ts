import type { PremadeList, TripBlockData } from "./types";

function getTodayDateValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const todayDateValue = getTodayDateValue();

export const mockTripBlocks: TripBlockData[] = [
  {
    id: "block-restaurants",
    kind: "list",
    title: todayDateValue,
    date: todayDateValue,
    colorId: "blue",
    items: [],
  },
];

export const mockPremadeLists: PremadeList[] = [
  {
    id: "backpack-pack",
    title: "Backpack Pack",
    items: [
      "Passport / ID",
      "Wallet",
      "Phone charger",
      "Power bank",
      "Water bottle",
      "Headphones",
      "Tissues",
      "Medicine",
      "Sunglasses",
      "Snacks",
    ],
  },
  {
    id: "beach-day",
    title: "Beach Day",
    items: [
      "Swimsuit",
      "Sunscreen",
      "Beach towel",
      "Sandals",
      "Hat",
      "Water bottle",
      "Dry bag",
      "Change of clothes",
    ],
  },
  {
    id: "hotel-stay",
    title: "Hotel Stay",
    items: [
      "Clothes",
      "Toothbrush",
      "Toothpaste",
      "Skincare",
      "Sleepwear",
      "Phone charger",
      "Booking confirmation",
    ],
  },
  {
    id: "road-trip",
    title: "Road Trip",
    items: [
      "Driver license",
      "Car documents",
      "Sunglasses",
      "Snacks",
      "Water",
      "Aux cable",
      "Emergency cash",
      "First-aid kit",
    ],
  },
  {
    id: "camera-gear",
    title: "Camera Gear",
    items: [
      "Camera body",
      "Lens cloth",
      "Extra batteries",
      "Memory cards",
      "Tripod",
      "Charger",
      "Camera strap",
    ],
  },
  {
    id: "camping",
    title: "Camping",
    items: [
      "Tent",
      "Sleeping bag",
      "Headlamp",
      "Bug spray",
      "Matches",
      "Cookware",
      "Trash bags",
      "Warm layer",
    ],
  },
];
