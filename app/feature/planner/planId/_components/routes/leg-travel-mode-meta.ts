import { Bike, BusFront, Car, Footprints, TrainFront, type LucideIcon } from "lucide-react";

import type { LegTravelMode } from "../constants/types";

/** How each travel mode is named and drawn in the itinerary. */
export const LEG_TRAVEL_MODE_META: Record<LegTravelMode, { label: string; Icon: LucideIcon }> = {
  drive: { label: "Drive", Icon: Car },
  transit: { label: "Public transit", Icon: TrainFront },
  rail: { label: "MRT & rail", Icon: TrainFront },
  bus: { label: "Bus", Icon: BusFront },
  bike: { label: "Bike", Icon: Bike },
  walk: { label: "Walk", Icon: Footprints },
};
