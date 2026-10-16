import type { TripBlockData } from "../../../app/feature/planner/planId/_components/constants/types";

export const dayViewBlocks: TripBlockData[] = [
  { id: "saved-list", kind: "list", title: "My places", date: "2026-10-20", colorId: "teal", items: [] },
  ...[1, 2, 3].map((day): TripBlockData => ({
    id: `day-${day}`, kind: "itinerary", title: `Day ${day}`,
    date: `2026-10-${20 + day}`, colorId: "teal", items: [],
  })),
];
