import type { EvConnectorType } from "./types";
import type { EvCar, UserVehicle } from "./vehicle.types";

export const evConnectorOptions: EvConnectorType[] = [
  "CCS2",
  "TYPE2",
  "CHADEMO",
  "NACS",
  "GB_T",
];

export const EV_PLACEHOLDER_IMAGE_URL =
  "https://autovista24.autovistagroup.com/wp-content/uploads/sites/5/2021/09/what-is-an-ev-1024x653.jpg";


export const evCarDatabase: EvCar[] = [
  {
    id: "mg-comet-ev",
    make: "MG",
    model: "Comet EV",
    year: 2024,
    batteryKwh: 17.3,
    rangeKm: 200,
    consumptionKwhPer100km: 8.7,
    maxAcKw: 6.6,
    maxDcKw: 0,
    connectorTypes: ["TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "byd-atto-3",
    make: "BYD",
    model: "Atto 3",
    year: 2024,
    batteryKwh: 60.5,
    rangeKm: 420,
    consumptionKwhPer100km: 14.4,
    maxAcKw: 11,
    maxDcKw: 88,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "byd-dolphin",
    make: "BYD",
    model: "Dolphin",
    year: 2024,
    batteryKwh: 44.9,
    rangeKm: 340,
    consumptionKwhPer100km: 13.2,
    maxAcKw: 11,
    maxDcKw: 60,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "byd-seal",
    make: "BYD",
    model: "Seal",
    year: 2024,
    batteryKwh: 82.5,
    rangeKm: 570,
    consumptionKwhPer100km: 14.5,
    maxAcKw: 11,
    maxDcKw: 150,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "neta-v-pro",
    make: "Neta",
    model: "V Pro",
    year: 2023,
    batteryKwh: 38.5,
    rangeKm: 401,
    consumptionKwhPer100km: 9.6,
    maxAcKw: 6.6,
    maxDcKw: 40,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "neta-aya",
    make: "Neta",
    model: "AYA",
    year: 2024,
    batteryKwh: 19.6,
    rangeKm: 220,
    consumptionKwhPer100km: 8.9,
    maxAcKw: 6.6,
    maxDcKw: 0,
    connectorTypes: ["TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "ora-good-cat",
    make: "ORA",
    model: "Good Cat",
    year: 2023,
    batteryKwh: 63,
    rangeKm: 500,
    consumptionKwhPer100km: 12.6,
    maxAcKw: 11,
    maxDcKw: 80,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "aion-y-plus",
    make: "GAC Aion",
    model: "Y Plus",
    year: 2024,
    batteryKwh: 70,
    rangeKm: 610,
    consumptionKwhPer100km: 11.5,
    maxAcKw: 11,
    maxDcKw: 80,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "tesla-model-3",
    make: "Tesla",
    model: "Model 3 RWD",
    year: 2024,
    batteryKwh: 57.5,
    rangeKm: 513,
    consumptionKwhPer100km: 11.2,
    maxAcKw: 11,
    maxDcKw: 170,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "volvo-ex30",
    make: "Volvo",
    model: "EX30",
    year: 2024,
    batteryKwh: 51,
    rangeKm: 480,
    consumptionKwhPer100km: 10.6,
    maxAcKw: 11,
    maxDcKw: 130,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "mercedes-eqa250",
    make: "Mercedes-Benz",
    model: "EQA 250",
    year: 2024,
    batteryKwh: 66.5,
    rangeKm: 450,
    consumptionKwhPer100km: 14.8,
    maxAcKw: 11,
    maxDcKw: 100,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
  {
    id: "ioniq5-std",
    make: "Hyundai",
    model: "IONIQ 5 Std",
    year: 2024,
    batteryKwh: 58,
    rangeKm: 403,
    consumptionKwhPer100km: 14.4,
    maxAcKw: 11,
    maxDcKw: 220,
    connectorTypes: ["CCS2", "TYPE2"],
    imageUrl: EV_PLACEHOLDER_IMAGE_URL,
  },
];

export function getAllEvCars(): EvCar[] {
  return evCarDatabase;
}

export function getEvCarById(id: string): EvCar | undefined {
  return evCarDatabase.find((car) => car.id === id);
}

export function getVehicleCar(vehicle: UserVehicle): EvCar | undefined {
  if (vehicle.source === "custom") {
    return vehicle.customCar;
  }

  return getEvCarById(vehicle.carId);
}
