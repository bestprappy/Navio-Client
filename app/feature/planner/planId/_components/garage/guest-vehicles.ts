import { atom } from "jotai";
import { customVehicleSchema, savedVehicleSchema, vehicleCatalogSchema, type CatalogVehicle, type SavedVehicle, type VehicleCommand } from "./vehicle-api";

export const guestVehiclesAtom = atom<SavedVehicle[]>([]);

/** Temporary vehicle edits for route estimates, with no account/API writes. */
export function applyGuestVehicleCommand(vehicles: SavedVehicle[], command: VehicleCommand, publishedVehicle?: CatalogVehicle): SavedVehicle[] {
  if (command.kind === "catalog") {
    const catalog = vehicleCatalogSchema.parse(publishedVehicle);
    if (catalog.id !== command.catalogId) throw new Error("Choose the vehicle again.");
    const current = vehicles.find((vehicle) => vehicle.catalog?.id === catalog.id);
    if (!current && vehicles.length >= 25) throw new Error("Remove a vehicle before adding another.");
    const now = new Date().toISOString();
    const saved = savedVehicleSchema.parse(current ? { ...current, consumptionKwhPer100km: command.consumptionKwhPer100km, settings: { ...current.settings, startingBatteryPct: command.startingBatteryPct }, isDefault: true, updatedAt: now } : {
      id: crypto.randomUUID(), nickname: null, make: catalog.make, model: catalog.model, year: catalog.year,
      batteryCapacityKwh: catalog.batteryCapacityKwh, rangeKm: catalog.rangeKm, connectorTypes: catalog.connectorTypes,
      consumptionKwhPer100km: command.consumptionKwhPer100km, isDefault: true, catalog,
      settings: { maxAcKw: catalog.maxAcKw, maxDcKw: catalog.maxDcKw, startingBatteryPct: command.startingBatteryPct, imageUrl: catalog.imageUrl || null },
      createdAt: now, updatedAt: now,
    });
    return [...vehicles.filter((vehicle) => vehicle.id !== saved.id).map((vehicle) => ({ ...vehicle, isDefault: false })), saved];
  }
  if (command.kind === "delete") {
    const remaining = vehicles.filter((vehicle) => vehicle.id !== command.id);
    if (remaining.length && !remaining.some((vehicle) => vehicle.isDefault)) return remaining.map((vehicle, index) => ({ ...vehicle, isDefault: index === 0 }));
    return remaining;
  }
  const now = new Date().toISOString();
  let saved: SavedVehicle;
  if (command.kind === "custom") {
    if (vehicles.length >= 25) throw new Error("Remove a vehicle before adding another.");
    saved = { ...customVehicleSchema.parse(command.vehicle), id: crypto.randomUUID(), isDefault: true, catalog: null, createdAt: now, updatedAt: now };
  } else {
    const current = vehicles.find((vehicle) => vehicle.id === command.id);
    if (!current) throw new Error("This vehicle is no longer in the trip.");
    saved = savedVehicleSchema.parse({ ...current, ...command.patch, settings: { ...current.settings, ...command.patch.settings }, updatedAt: now });
  }
  return [...vehicles.filter((vehicle) => vehicle.id !== saved.id).map((vehicle) => saved.isDefault ? { ...vehicle, isDefault: false } : vehicle), saved];
}
