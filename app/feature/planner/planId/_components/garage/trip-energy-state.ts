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
});
export type TripEnergyState = z.infer<typeof tripEnergyStateSchema>;
export type TripEnergySnapshot = z.infer<typeof tripEnergySnapshotSchema>;
// Undefined means historical/omitted; null is an explicit clear on the wire.
export const tripEnergyStateAtom = atom<TripEnergyState | null | undefined>(undefined);
export function snapshotTripVehicle(vehicle: SavedVehicle): TripEnergySnapshot {
  return tripEnergySnapshotSchema.parse({
    version: 1, vehicleId: vehicle.id, label: vehicle.nickname || `${vehicle.make} ${vehicle.model}`,
    profile: vehicle.energyProfile ?? legacyEnergyProfile(vehicle),
    maxAcKw: vehicle.settings.maxAcKw, maxDcKw: vehicle.settings.maxDcKw,
    connectorTypes: vehicle.connectorTypes, legacyConsumptionConfirmed: vehicle.legacyConsumptionConfirmed === true,
  });
}
