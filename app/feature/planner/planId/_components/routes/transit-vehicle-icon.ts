import { BusFront, Ship, TrainFront, TrainFrontTunnel, TramFront, type LucideIcon } from "lucide-react";

import type { TransitVehicleKind } from "./transit-journey-filters";

export const TRANSIT_VEHICLE_ICON: Record<TransitVehicleKind, LucideIcon> = {
  Metro: TrainFrontTunnel,
  Train: TrainFront,
  Monorail: TrainFront,
  Tram: TramFront,
  Bus: BusFront,
  Ferry: Ship,
  Other: TrainFront,
};
