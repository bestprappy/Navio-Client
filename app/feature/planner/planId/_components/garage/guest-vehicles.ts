import { atom } from "jotai";
import { customVehicleSchema, savedVehicleSchema, vehicleCatalogSchema, legacyEnergyProfile, type SavedVehicle, type VehicleCommand } from "./vehicle-api";
import { defaultEnergyProfile, isLegacyVehicle } from "./energy-selection";

export const guestVehiclesAtom = atom<SavedVehicle[]>([]);

/** Temporary vehicle edits for route estimates, with no account/API writes. */
export function applyGuestVehicleCommand(vehicles: SavedVehicle[], command: VehicleCommand): SavedVehicle[] {
  if (command.kind === "delete") {
    const remaining = vehicles.filter((vehicle) => vehicle.id !== command.id);
    if (remaining.length && !remaining.some((vehicle) => vehicle.isDefault)) return remaining.map((vehicle, index) => ({ ...vehicle, isDefault: index === 0 }));
    return remaining;
  }
  const now = new Date().toISOString();
  let saved: SavedVehicle;
  if (command.kind === "catalog") {
    if (vehicles.length >= 25) throw new Error("Remove a vehicle before adding another.");
    const catalog = vehicleCatalogSchema.parse(command.catalogVehicle);
    if (catalog.id !== command.catalogId) throw new Error("Choose the catalogue vehicle again.");
    saved = savedVehicleSchema.parse({
      id: crypto.randomUUID(), nickname: null, make: catalog.make, model: catalog.model, year: catalog.year,
      batteryCapacityKwh: catalog.batteryCapacityKwh, rangeKm: catalog.rangeKm,
      consumptionKwhPer100km: command.consumptionKwhPer100km ?? null, connectorTypes: catalog.connectorTypes,
      isDefault: true, catalog, createdAt: now, updatedAt: now,
      settings: { maxAcKw: catalog.maxAcKw, maxDcKw: catalog.maxDcKw, imageUrl: catalog.imageUrl,
        startingBatteryPct: command.startingBatteryPct },
    });
  } else if (command.kind === "custom") {
    if (vehicles.length >= 25) throw new Error("Remove a vehicle before adding another.");
    saved = savedVehicleSchema.parse({ ...customVehicleSchema.parse(command.vehicle), id: crypto.randomUUID(), isDefault: true, catalog: null, createdAt: now, updatedAt: now });
  } else {
    const current = vehicles.find((vehicle) => vehicle.id === command.id);
    if (!current) throw new Error("This vehicle is no longer in the trip.");
    saved = savedVehicleSchema.parse({ ...current, ...command.patch, settings: { ...current.settings, ...command.patch.settings }, updatedAt: now });
  }
  const provenance = command.kind === "custom" ? command.vehicle.consumptionProvenance
    : command.kind === "catalog" ? command.consumptionProvenance : command.patch.consumptionProvenance;
  const selection = command.kind === "custom" ? command.vehicle.energySelection
    : command.kind === "catalog" ? command.energySelection : command.patch.energySelection;
  const supplied = command.kind === "custom" ? command.vehicle.consumptionKwhPer100km
    : command.kind === "catalog" ? command.consumptionKwhPer100km : command.patch.consumptionKwhPer100km;
  if (selection === "CONFIRM_LEGACY") {
    if (command.kind !== "update" || supplied != null || provenance || !isLegacyVehicle(saved) || saved.consumptionKwhPer100km === null) {
      throw new Error("Confirm only an existing legacy consumption value without changing it.");
    }
    saved.legacyConsumptionConfirmed = true;
  } else if (selection === "USE_DEFAULT" || selection === "RESET_DEFAULT" || selection === "USE_RATED_RANGE") {
    if (supplied != null || provenance) throw new Error("Default selection must not include a consumption override.");
    saved.energyProfile = defaultEnergyProfile(saved.catalog, saved.rangeKm, selection === "USE_RATED_RANGE");
    if (selection === "USE_RATED_RANGE" && saved.energyProfile.modelKind !== "RATED_RANGE") throw new Error("A positive rated range is required for NAVIO Estimate.");
    saved.consumptionKwhPer100km = saved.energyProfile.consumptionKwhPer100km;
    saved.legacyConsumptionConfirmed = false;
  } else if (selection === "USER_OVERRIDE") {
    if (supplied == null || !Number.isFinite(supplied) || supplied <= 0) throw new Error("Enter a positive observed average consumption.");
    saved.energyProfile = { ...defaultEnergyProfile(saved.catalog, saved.rangeKm),
      modelKind: "CONSUMPTION", selectionMode: "USER_OVERRIDE", consumptionKwhPer100km: supplied,
      consumptionSource: "USER_OBSERVED", consumptionMeasurementBasis: provenance?.consumptionMeasurementBasis ?? "UNKNOWN",
      consumptionStandard: "NONE", sourceUrl: null };
    saved.legacyConsumptionConfirmed = false;
  }
  const writesConsumption = command.kind !== "update" || command.patch.consumptionKwhPer100km !== undefined;
  if (provenance && !writesConsumption) throw new Error("Observed consumption provenance requires a consumption value.");
  if (writesConsumption && !selection) {
    saved.legacyConsumptionConfirmed = false;
    saved.energyProfile = legacyEnergyProfile(saved);
    if (provenance) saved.energyProfile = {
      ...saved.energyProfile, selectionMode: "USER_OVERRIDE", consumptionSource: "USER_OBSERVED",
      consumptionMeasurementBasis: provenance.consumptionMeasurementBasis ?? "UNKNOWN",
    };
  }
  return [...vehicles.filter((vehicle) => vehicle.id !== saved.id).map((vehicle) => saved.isDefault ? { ...vehicle, isDefault: false } : vehicle), saved];
}
