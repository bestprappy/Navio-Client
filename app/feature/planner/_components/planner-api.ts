import type {
  ChecklistItem,
  EvCharger,
  EvChargerSource,
  EvChargerStatus,
  EvChargerVerificationStatus,
  EvConnectorType,
  NoteItem,
  PlaceItem,
  PlaceItemEvChargerDetails,
  TripBlockData,
  TripBlockItem,
} from "../planId/_components/constants/types";
import type {
  CurrencyCode,
  ExpenseItem,
  TripBudgetState,
} from "../planId/_components/budget/budget.types";

const EV_CONNECTOR_TYPES = new Set<EvConnectorType>([
  "CCS1",
  "CCS2",
  "CHADEMO",
  "TYPE2",
  "J1772",
  "NACS",
  "GB_T",
  "OTHER",
]);

export type CreateTripPayload = {
  displayName: string;
  startDate: string;
  endDate: string;
  destinationId: string;
  destinationName: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationCountry?: string;
};

export type TripResponse = {
  id: string;
  displayName: string;
  startDate: string;
  endDate: string;
  destinationId: string;
  destinationName: string;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationCountry: string | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
};

export type PlannerSnapshot = {
  blocks: TripBlockData[];
  budget: TripBudgetState;
  version: number;
  savedAt: string;
};

export type CurrencyRateResponse = {
  base: CurrencyCode;
  quote: CurrencyCode;
  rate: number;
  asOf: string;
  source: string;
};

export type PlannerSaveAcknowledgement = {
  version: number;
  savedAt: string;
};

export type EvOptimizationVehiclePayload = {
  batteryKwh: number;
  consumptionKwhPer100km: number;
  maxAcKw: number;
  maxDcKw: number;
  connectorTypes: EvConnectorType[];
};

export type EvOptimizationRequestPayload = {
  blockId: string;
  vehicle: EvOptimizationVehiclePayload;
  startingSocPct: number;
  reserveSocPct?: number;
  targetSocPct?: number;
  maximumDetourKm?: number;
  expectedVersion?: number;
};

export type EvOptimizationOperationType =
  | "ADD_CHARGER"
  | "REMOVE_CHARGER"
  | "REPLACE_CHARGER"
  | "UPDATE_CHARGER";

export type EvOptimizationOperation = {
  type: EvOptimizationOperationType;
  oldItemId: string | null;
  beforeItemId: string | null;
  sequence: number;
  charger: EvCharger | null;
  estimatedChargeMinutes: number;
  arrivalSocPct: number;
  departureSocPct: number;
  detourKm: number;
  reason: string;
};

export type EvOptimizationPreview = {
  baseVersion: number;
  blockId: string;
  feasible: boolean;
  operations: EvOptimizationOperation[];
  finalSocPct: number;
  totalDrivingSeconds: number;
  totalChargingMinutes: number;
  message: string;
  warnings: string[];
};

export type TripPage = {
  content: TripResponse[];
  totalElements: number;
};

export class PlannerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PlannerApiError";
  }
}

export function isPersistedTripId(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

export async function createTrip(
  payload: CreateTripPayload,
): Promise<TripResponse> {
  const value = await requestJson("/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!isTripResponse(value)) {
    throw new PlannerApiError("Trip service returned an invalid trip.", 502);
  }
  return value;
}

export async function listTrips(page = 0, size = 20): Promise<TripPage> {
  const value = await requestJson(`/api/trips?page=${page}&size=${size}`);
  if (!isTripPage(value)) {
    throw new PlannerApiError("Trip service returned an invalid trip list.", 502);
  }
  return {
    content: value.content,
    totalElements:
      typeof value.totalElements === "number"
        ? value.totalElements
        : value.content.length,
  };
}

export async function getPlannerSnapshot(
  tripId: string,
): Promise<PlannerSnapshot> {
  const value = await requestJson(`/api/trips/${encodeURIComponent(tripId)}/planner`);
  if (!isPlannerSnapshot(value)) {
    throw new PlannerApiError("Trip service returned an invalid planner.", 502);
  }
  return value;
}

export async function savePlannerSnapshot(
  tripId: string,
  blocks: TripBlockData[],
  budget: TripBudgetState,
  version: number,
): Promise<PlannerSaveAcknowledgement> {
  const value = await requestJson(
    `/api/trips/${encodeURIComponent(tripId)}/planner`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version, blocks, budget }),
    },
  );
  if (!isPlannerSaveAcknowledgement(value)) {
    throw new PlannerApiError("Trip service returned an invalid save acknowledgement.", 502);
  }
  return value;
}

export async function previewTripEvOptimization(
  tripId: string,
  payload: EvOptimizationRequestPayload,
): Promise<EvOptimizationPreview> {
  const value = await requestJson(
    `/api/trips/${encodeURIComponent(tripId)}/ev-optimization/preview`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!isEvOptimizationPreview(value)) {
    throw new PlannerApiError(
      "Trip service returned an invalid EV optimization preview.",
      502,
    );
  }
  return value;
}

export async function applyTripEvOptimization(
  tripId: string,
  payload: EvOptimizationRequestPayload & { expectedVersion: number },
): Promise<PlannerSnapshot> {
  const value = await requestJson(
    `/api/trips/${encodeURIComponent(tripId)}/ev-optimization/apply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!isPlannerSnapshot(value)) {
    throw new PlannerApiError(
      "Trip service returned an invalid optimized planner.",
      502,
    );
  }
  return value;
}

export async function getCurrencyRate(
  base: CurrencyCode,
  quote: CurrencyCode,
): Promise<CurrencyRateResponse> {
  const search = new URLSearchParams({ base, quote });
  const value = await requestJson(`/api/trips/currencies/rate?${search}`);
  if (!isCurrencyRateResponse(value)) {
    throw new PlannerApiError("Trip service returned an invalid currency rate.", 502);
  }
  return value;
}

async function requestJson(
  input: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    console.error("Planner API request failed.", { input, error });
    throw new PlannerApiError("Unable to reach the trip service.", 0);
  }

  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      isRecord(value) && typeof value.message === "string"
        ? value.message
        : isRecord(value) && typeof value.error === "string"
          ? value.error
        : `Planner request failed (${response.status}).`;
    throw new PlannerApiError(message, response.status);
  }
  return value;
}

function isPlannerSnapshot(value: unknown): value is PlannerSnapshot {
  return (
    isRecord(value) &&
    isPlannerBlocks(value.blocks) &&
    isTripBudgetState(value.budget) &&
    typeof value.version === "number" &&
    typeof value.savedAt === "string"
  );
}

function isEvOptimizationPreview(
  value: unknown,
): value is EvOptimizationPreview {
  return (
    isRecord(value) &&
    typeof value.baseVersion === "number" &&
    typeof value.blockId === "string" &&
    typeof value.feasible === "boolean" &&
    Array.isArray(value.operations) &&
    value.operations.every(isEvOptimizationOperation) &&
    typeof value.finalSocPct === "number" &&
    typeof value.totalDrivingSeconds === "number" &&
    typeof value.totalChargingMinutes === "number" &&
    typeof value.message === "string" &&
    Array.isArray(value.warnings) &&
    value.warnings.every((warning) => typeof warning === "string")
  );
}

function isEvOptimizationOperation(
  value: unknown,
): value is EvOptimizationOperation {
  return (
    isRecord(value) &&
    isEvOptimizationOperationType(value.type) &&
    isNullableString(value.oldItemId) &&
    isNullableString(value.beforeItemId) &&
    typeof value.sequence === "number" &&
    (value.charger === null || isFullEvCharger(value.charger)) &&
    typeof value.estimatedChargeMinutes === "number" &&
    typeof value.arrivalSocPct === "number" &&
    typeof value.departureSocPct === "number" &&
    typeof value.detourKm === "number" &&
    typeof value.reason === "string"
  );
}

function isEvOptimizationOperationType(
  value: unknown,
): value is EvOptimizationOperationType {
  return (
    value === "ADD_CHARGER" ||
    value === "REMOVE_CHARGER" ||
    value === "REPLACE_CHARGER" ||
    value === "UPDATE_CHARGER"
  );
}

function isFullEvCharger(value: unknown): value is EvCharger {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.operatorName) &&
    isEvChargerLocation(value.location) &&
    isNullableString(value.address) &&
    isNullableString(value.province) &&
    Array.isArray(value.connectorTypes) &&
    value.connectorTypes.every(isEvConnectorType) &&
    typeof value.maxKw === "number" &&
    typeof value.totalConnectors === "number" &&
    isNullableNumber(value.availableConnectors) &&
    isNullableString(value.priceText) &&
    isRecord(value.openingHours) &&
    isEvChargerSource(value.source) &&
    isEvChargerVerificationStatus(value.verificationStatus) &&
    isEvChargerStatus(value.status) &&
    typeof value.ratingAvg === "number" &&
    typeof value.ratingCount === "number" &&
    typeof value.confidenceScore === "number" &&
    typeof value.stale === "boolean"
  );
}

function isEvChargerLocation(value: unknown): value is EvCharger["location"] {
  return (
    isRecord(value) &&
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    isNullableString(value.address) &&
    isNullableString(value.placeId)
  );
}

function isEvChargerSource(value: unknown): value is EvChargerSource {
  return (
    value === "GOOGLE_PLACES" ||
    value === "OPENCHARGEMAP" ||
    value === "ADMIN_IMPORT" ||
    value === "USER_SUBMITTED" ||
    value === "PARTNER_API" ||
    value === "TRIP_SNAPSHOT"
  );
}

function isEvChargerVerificationStatus(
  value: unknown,
): value is EvChargerVerificationStatus {
  return (
    value === "UNVERIFIED" ||
    value === "PENDING_VERIFICATION" ||
    value === "GOOGLE_CACHED" ||
    value === "USER_VERIFIED" ||
    value === "ADMIN_VERIFIED" ||
    value === "REJECTED" ||
    value === "STALE"
  );
}

function isEvChargerStatus(value: unknown): value is EvChargerStatus {
  return (
    value === "active" ||
    value === "temporarily_closed" ||
    value === "permanently_closed" ||
    value === "unknown"
  );
}

export function isTripBudgetState(value: unknown): value is TripBudgetState {
  return (
    isRecord(value) &&
    isCurrencyCode(value.currency) &&
    isFiniteNonNegativeNumber(value.amount) &&
    Array.isArray(value.expenses) &&
    value.expenses.every(isExpenseItem)
  );
}

function isExpenseItem(value: unknown): value is ExpenseItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isFinitePositiveNumber(value.amount) &&
    typeof value.label === "string" &&
    typeof value.categoryId === "string" &&
    isOptionalString(value.date)
  );
}

function isCurrencyRateResponse(value: unknown): value is CurrencyRateResponse {
  return (
    isRecord(value) &&
    isCurrencyCode(value.base) &&
    isCurrencyCode(value.quote) &&
    isFinitePositiveNumber(value.rate) &&
    typeof value.asOf === "string" &&
    typeof value.source === "string"
  );
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === "THB" || value === "USD" || value === "EUR" || value === "JPY";
}

function isPlannerSaveAcknowledgement(
  value: unknown,
): value is PlannerSaveAcknowledgement {
  return (
    isRecord(value) &&
    typeof value.version === "number" &&
    typeof value.savedAt === "string"
  );
}

export function isPlannerBlocks(value: unknown): value is TripBlockData[] {
  return Array.isArray(value) && value.every(isTripBlock);
}

function isTripPage(
  value: unknown,
): value is { content: TripResponse[]; totalElements?: unknown } {
  return (
    isRecord(value) &&
    Array.isArray(value.content) &&
    value.content.every(isTripResponse)
  );
}

function isTripResponse(value: unknown): value is TripResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.displayName === "string" &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    typeof value.destinationId === "string" &&
    typeof value.destinationName === "string" &&
    isNullableNumber(value.destinationLat) &&
    isNullableNumber(value.destinationLng) &&
    isNullableString(value.destinationCountry) &&
    typeof value.visibility === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isTripBlock(value: unknown): value is TripBlockData {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.kind === "itinerary" || value.kind === "list") &&
    typeof value.title === "string" &&
    typeof value.date === "string" &&
    typeof value.colorId === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isTripBlockItem)
  );
}

function isTripBlockItem(value: unknown): value is TripBlockItem {
  if (!isRecord(value) || typeof value.id !== "string") return false;
  if (value.type === "note") return isNoteItem(value);
  if (value.type === "checklist") return isChecklistItem(value);
  if (value.type === "place") return isPlaceItem(value);
  return false;
}

function isNoteItem(value: Record<string, unknown>): value is NoteItem {
  return typeof value.content === "string";
}

function isChecklistItem(
  value: Record<string, unknown>,
): value is ChecklistItem {
  return (
    typeof value.title === "string" &&
    Array.isArray(value.items) &&
    value.items.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.label === "string" &&
        typeof item.checked === "boolean",
    )
  );
}

function isPlaceItem(value: Record<string, unknown>): value is PlaceItem {
  return (
    typeof value.placeId === "string" &&
    typeof value.name === "string" &&
    typeof value.address === "string" &&
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    isOptionalString(value.description) &&
    isOptionalNumber(value.rating) &&
    isOptionalNumber(value.reviewCount) &&
    isOptionalString(value.imageUrl) &&
    isOptionalString(value.notes) &&
    isOptionalBoolean(value.isVisited) &&
    isOptionalString(value.time) &&
    isOptionalString(value.timeEnd) &&
    isOptionalNumber(value.cost) &&
    (value.evCharger === undefined || isEvCharger(value.evCharger))
  );
}

function isEvCharger(value: unknown): value is PlaceItemEvChargerDetails {
  return (
    isRecord(value) &&
    Array.isArray(value.connectorTypes) &&
    value.connectorTypes.every(isEvConnectorType) &&
    typeof value.maxKw === "number" &&
    typeof value.totalConnectors === "number" &&
    isNullableNumber(value.availableConnectors) &&
    isNullableString(value.priceText) &&
    isNullableString(value.openingHoursSummary) &&
    typeof value.estimatedChargeMinutes === "number" &&
    isNullableString(value.operatorName) &&
    (value.selectionSource === undefined ||
      value.selectionSource === "AUTO" ||
      value.selectionSource === "MANUAL") &&
    isOptionalBoolean(value.locked)
  );
}

function isEvConnectorType(value: unknown): value is EvConnectorType {
  return typeof value === "string" && EV_CONNECTOR_TYPES.has(value as EvConnectorType);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === "boolean";
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
