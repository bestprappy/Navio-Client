import { atom } from "jotai";
import { z } from "zod";
import { legacyEnergyProfile, vehicleEnergyProfileSchema, type SavedVehicle } from "./vehicle-api";

export const tripEnergySnapshotSchema = z.object({
  version: z.literal(1),
  vehicleId: z.string().min(1).max(160),
  label: z.string().max(240),
  profile: vehicleEnergyProfileSchema,
  maxAcKw: z.number().finite().nonnegative().nullable(),
  maxDcKw: z.number().finite().nonnegative().nullable(),
  connectorTypes: z.array(z.enum(["CCS1", "CCS2", "CHADEMO", "NACS", "GB_T", "TYPE2", "J1772", "OTHER"])),
  legacyConsumptionConfirmed: z.boolean(),
});
export const tripEnergyStateSchema = z.object({
  initialSocPct: z.number().finite().min(0).max(100).nullable(),
  vehicleSnapshot: tripEnergySnapshotSchema.nullable(),
  garageVehicleIds: z.array(z.uuid()).max(25).refine(ids => new Set(ids).size === ids.length).optional(),
});
export type TripEnergyState = z.infer<typeof tripEnergyStateSchema>;
export type TripEnergySnapshot = z.infer<typeof tripEnergySnapshotSchema>;
// Undefined means historical/omitted; null is an explicit clear on the wire.
export const tripEnergyStateAtom = atom<TripEnergyState | null | undefined>(undefined);

/** Historical trips retain only their explicitly selected snapshot, never the account garage. */
export function tripGarageIds(state: TripEnergyState | null | undefined): string[] {
  return state?.garageVehicleIds ?? (state?.vehicleSnapshot ? [state.vehicleSnapshot.vehicleId] : []);
}

export function addTripVehicle(state: TripEnergyState | null | undefined, vehicle: SavedVehicle): TripEnergyState {
  const ids = [...new Set([...tripGarageIds(state), vehicle.id])];
  if (ids.length > 25) throw new Error("Remove a vehicle from this trip before adding another.");
  return { ...state, initialSocPct: state?.initialSocPct ?? null, garageVehicleIds: ids, vehicleSnapshot: snapshotTripVehicle(vehicle) };
}

export function removeTripVehicle(state: TripEnergyState | null | undefined, id: string): TripEnergyState {
  return { ...state, initialSocPct: state?.initialSocPct ?? null,
    garageVehicleIds: tripGarageIds(state).filter(value => value !== id),
    vehicleSnapshot: state?.vehicleSnapshot?.vehicleId === id ? null : state?.vehicleSnapshot ?? null };
}
export function snapshotTripVehicle(vehicle: SavedVehicle): TripEnergySnapshot {
  return tripEnergySnapshotSchema.parse({
    version: 1, vehicleId: vehicle.id, label: vehicle.nickname || `${vehicle.make} ${vehicle.model}`,
    profile: vehicle.energyProfile ?? legacyEnergyProfile(vehicle),
    maxAcKw: vehicle.settings.maxAcKw, maxDcKw: vehicle.settings.maxDcKw,
    connectorTypes: vehicle.connectorTypes, legacyConsumptionConfirmed: vehicle.legacyConsumptionConfirmed === true,
  });
}
