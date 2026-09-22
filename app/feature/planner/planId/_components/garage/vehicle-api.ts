import { z } from "zod";

const positiveNumber = z.number().finite().positive();
const energySelectionSchema = z.enum(["USE_DEFAULT", "USER_OVERRIDE", "RESET_DEFAULT", "USE_RATED_RANGE", "CONFIRM_LEGACY"]);
export type EnergySelection = z.infer<typeof energySelectionSchema>;
const energyStandard = z.enum(["NEDC", "WLTP", "EPA", "CLTC", "OTHER", "NONE"]);
export const vehicleEnergyProfileSchema = z.object({
  version: z.literal(1),
  modelKind: z.enum(["CONSUMPTION", "RATED_RANGE", "UNAVAILABLE"]),
  selectionMode: z.enum(["CATALOG_DEFAULT", "USER_OVERRIDE", "LEGACY_UNCONFIRMED"]),
  consumptionKwhPer100km: positiveNumber.nullable(),
  consumptionSource: z.enum(["USER_OBSERVED", "MANUFACTURER_REPORTED", "REGULATORY_REPORTED", "UNKNOWN"]),
  consumptionMeasurementBasis: z.enum(["BATTERY_SIDE", "WALL_SIDE", "TRIP_COMPUTER", "UNKNOWN"]),
  consumptionStandard: energyStandard,
  sourceUrl: z.url({ protocol: /^https$/ }).nullable(),
  usableBatteryCapacityKwh: positiveNumber.nullable(),
  capacityBasis: z.enum(["USABLE", "GROSS", "MANUFACTURER_DECLARED_UNSPECIFIED", "UNKNOWN"]),
  ratedRangeKm: positiveNumber.nullable(),
  ratedRangeStandard: energyStandard,
});
export type VehicleEnergyProfile = z.infer<typeof vehicleEnergyProfileSchema>;
export const consumptionProvenanceSchema = z.object({
  consumptionSource: z.literal("USER_OBSERVED"),
  consumptionMeasurementBasis: z.enum(["UNKNOWN", "TRIP_COMPUTER", "BATTERY_SIDE"]).optional(),
});
export type ConsumptionProvenance = z.infer<typeof consumptionProvenanceSchema>;
export const userObservedConsumption: ConsumptionProvenance = {
  consumptionSource: "USER_OBSERVED", consumptionMeasurementBasis: "UNKNOWN",
};
const connectorSchema = z.enum(["CCS1", "CCS2", "TYPE2", "J1772", "CHADEMO", "NACS", "GB_T"]);
const imageUrlSchema = z.string().max(2048).refine(
  (value) => value === "" || /^\/images\/vehicles\/[a-z0-9-]+\.(png|webp)$/.test(value) ||
    z.url({ protocol: /^https$/ }).safeParse(value).success,
  "Use an HTTPS image URL.",
);

export const vehicleSettingsSchema = z.object({
  maxAcKw: z.number().min(0).max(1000).nullable(),
  maxDcKw: z.number().min(0).max(2000).nullable(),
  startingBatteryPct: z.number().int().min(0).max(100),
  imageUrl: imageUrlSchema.nullable(),
});

export const vehicleCatalogSchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1), model: z.string().min(1), trim: z.string().min(1),
  year: z.number().int().min(1900).max(2200).nullable(),
  market: z.literal("TH"),
  batteryCapacityKwh: positiveNumber,
  batteryCapacityBasis: z.literal("MANUFACTURER_DECLARED"),
  rangeKm: positiveNumber,
  rangeStandard: z.enum(["NEDC", "WLTP", "EPA", "CLTC"]),
  connectorTypes: z.array(connectorSchema).min(1),
  maxAcKw: z.number().nonnegative().nullable(), maxDcKw: z.number().nonnegative().nullable(),
  imageUrl: imageUrlSchema,
  sourceUrl: z.url({ protocol: /^https$/ }),
  verifiedAt: z.iso.date(),
  energyProfile: vehicleEnergyProfileSchema.nullish(),
});

export const savedVehicleSchema = z.object({
  legacyConsumptionConfirmed: z.boolean().optional(),
  id: z.uuid(), nickname: z.string().nullable(), make: z.string().min(1), model: z.string().min(1),
  year: z.number().int().nullable(), batteryCapacityKwh: positiveNumber, rangeKm: positiveNumber,
  consumptionKwhPer100km: positiveNumber.nullable(), connectorTypes: z.array(connectorSchema),
  isDefault: z.boolean(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
  settings: vehicleSettingsSchema, catalog: vehicleCatalogSchema.nullable(),
  energyProfile: vehicleEnergyProfileSchema.nullish(),
});

export const customVehicleSchema = z.object({
  nickname: z.string().trim().max(100),
  make: z.string().trim().min(1, "Enter the make.").max(100),
  model: z.string().trim().min(1, "Enter the model.").max(100),
  year: z.number().int().min(1900).max(2200),
  batteryCapacityKwh: positiveNumber.max(999999.99), rangeKm: positiveNumber.max(999999.99),
  consumptionKwhPer100km: positiveNumber.max(99999.999).nullable(),
  connectorTypes: z.array(connectorSchema).min(1, "Choose at least one connector."),
  settings: vehicleSettingsSchema,
  consumptionProvenance: consumptionProvenanceSchema.optional(),
  energySelection: energySelectionSchema.optional(),
});

export type CatalogVehicle = z.infer<typeof vehicleCatalogSchema>;
export type SavedVehicle = z.infer<typeof savedVehicleSchema>;
/** Response-only description of old data; never rewrites consumption or selects a new calculation. */
export function legacyEnergyProfile(vehicle: SavedVehicle): VehicleEnergyProfile {
  return {
    version: 1,
    modelKind: vehicle.consumptionKwhPer100km !== null ? "CONSUMPTION" : "RATED_RANGE",
    selectionMode: "LEGACY_UNCONFIRMED", consumptionKwhPer100km: vehicle.consumptionKwhPer100km,
    consumptionSource: "UNKNOWN", consumptionMeasurementBasis: "UNKNOWN", consumptionStandard: "NONE",
    sourceUrl: null, usableBatteryCapacityKwh: null,
    capacityBasis: vehicle.catalog ? "MANUFACTURER_DECLARED_UNSPECIFIED" : "UNKNOWN",
    ratedRangeKm: vehicle.rangeKm, ratedRangeStandard: vehicle.catalog?.rangeStandard ?? "NONE",
  };
}
export type CustomVehicleInput = z.infer<typeof customVehicleSchema>;
export type VehiclePatch = { nickname?: string; isDefault?: boolean; consumptionKwhPer100km?: number; consumptionProvenance?: ConsumptionProvenance; energySelection?: EnergySelection; settings?: Partial<z.infer<typeof vehicleSettingsSchema>> };
export type VehicleCommand =
  | { kind: "catalog"; catalogId: string; catalogVehicle?: CatalogVehicle; consumptionKwhPer100km?: number; startingBatteryPct: number; consumptionProvenance?: ConsumptionProvenance; energySelection?: EnergySelection }
  | { kind: "custom"; vehicle: CustomVehicleInput }
  | { kind: "update"; id: string; patch: VehiclePatch }
  | { kind: "delete"; id: string };

export class VehicleApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function vehicleRequest<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/users/me/vehicles${path}`, {
      ...init, credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
    });
  } catch (cause) {
    if (init?.signal?.aborted) throw cause;
    console.error("Vehicle request failed.", { component: "vehicle-api", operation: init?.method ?? "GET", path, cause });
    throw new VehicleApiError("Could not reach your garage. Check your connection and try again.", 0);
  }
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Vehicle request was rejected.", { component: "vehicle-api", path, status: response.status });
    const details = z.object({ message: z.string(), validationErrors: z.record(z.string(), z.string()).optional() }).safeParse(body);
    const message = response.status === 401 ? "Your session has expired. Please sign in again."
      : response.status === 403 ? "Your account cannot access this garage."
      : response.status === 409 ? "Your garage changed elsewhere. Refresh and try again."
      : response.status >= 500 ? "Your garage is temporarily unavailable. Please try again."
      : details.success ? Object.values(details.data.validationErrors ?? {}).join(" ") || details.data.message
      : "Could not save your vehicle. Please try again.";
    throw new VehicleApiError(message, response.status);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("Unexpected vehicle response.", { component: "vehicle-api", path, fields: parsed.error.issues.map((issue) => issue.path.join(".")) });
    throw new VehicleApiError("Your garage returned an unexpected response. Please try again.", 502);
  }
  return parsed.data;
}

export function listVehicles(signal?: AbortSignal) {
  return vehicleRequest("", z.array(savedVehicleSchema), { signal });
}

export function listVehicleCatalog(signal?: AbortSignal) {
  return vehicleRequest("/catalog", z.array(vehicleCatalogSchema), { signal });
}

export async function executeVehicleCommand(command: VehicleCommand): Promise<SavedVehicle | null> {
  if (command.kind === "delete") {
    return vehicleRequest(`/${encodeURIComponent(command.id)}`, z.null(), { method: "DELETE" });
  }
  const path = command.kind === "catalog" ? `/catalog/${encodeURIComponent(command.catalogId)}`
    : command.kind === "update" ? `/${encodeURIComponent(command.id)}` : "";
  const body = command.kind === "catalog" ? {
    consumptionKwhPer100km: command.consumptionKwhPer100km, startingBatteryPct: command.startingBatteryPct,
    consumptionProvenance: command.consumptionProvenance,
    energySelection: command.energySelection,
  } : command.kind === "custom" ? { ...customVehicleSchema.parse(command.vehicle), isDefault: true } : command.patch;
  return vehicleRequest(path, savedVehicleSchema, { method: command.kind === "update" ? "PATCH" : "POST", body: JSON.stringify(body) });
}
