import type { CustomVehicleInput } from "./vehicle-api";

export const customVehicleDefaults: Partial<CustomVehicleInput> = {
  nickname: "", make: "", model: "", connectorTypes: ["TYPE2", "CCS2"],
  consumptionKwhPer100km: null,
  settings: { maxAcKw: null, maxDcKw: null, startingBatteryPct: 80, imageUrl: "" },
};

export const customVehicleNumberFields = [
  { name: "year", label: "Model year", min: 1900, max: 2200, step: "1" },
  { name: "batteryCapacityKwh", label: "Battery capacity (kWh)", min: 0.1, max: 999999.99, step: "0.01" },
  { name: "rangeKm", label: "Reference range (km)", min: 0.1, max: 999999.99, step: "0.01" },
  { name: "consumptionKwhPer100km", label: "Your average consumption (kWh/100 km, optional)", min: 0.001, max: 99999.999, step: "0.001" },
  { name: "settings.maxAcKw", label: "Max AC (kW, optional)", min: 0, max: 1000, step: "0.01" },
  { name: "settings.maxDcKw", label: "Max DC (kW, optional)", min: 0, max: 2000, step: "0.01" },
] as const;
