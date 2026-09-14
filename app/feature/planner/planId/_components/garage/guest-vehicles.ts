import { atom } from "jotai";
import { customVehicleSchema, savedVehicleSchema, type SavedVehicle, type VehicleCommand } from "./vehicle-api";

export const guestVehiclesAtom = atom<SavedVehicle[]>([]);

/** Temporary vehicle edits for route estimates, with no account/API writes. */
export function applyGuestVehicleCommand(vehicles: SavedVehicle[], command: VehicleCommand): SavedVehicle[] {
  if (command.kind === "catalog") throw new Error("Sign in to use your saved vehicle catalogue, or enter a custom EV for this trip.");
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
