import type { EvConnectorType } from "./types";
import type { EvCar, UserVehicle } from "./vehicle.types";

export const evConnectorOptions = ["CCS1", "CCS2", "TYPE2", "J1772", "CHADEMO", "NACS", "GB_T"] as const satisfies readonly EvConnectorType[];

export function getVehicleCar(vehicle: UserVehicle): EvCar {
  return vehicle.source === "custom" ? vehicle.customCar : vehicle.car;
}
