import type {
  ChecklistItem,
  EvConnectorType,
  NoteItem,
  PlaceItem,
  PlaceItemEvChargerDetails,
  TripBlockData,
  TripBlockItem,
} from "../planId/_components/constants/types";

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
  version: number;
  savedAt: string;
};

export type PlannerSaveAcknowledgement = {
  version: number;
  savedAt: string;
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
  version: number,
): Promise<PlannerSaveAcknowledgement> {
  const value = await requestJson(
    `/api/trips/${encodeURIComponent(tripId)}/planner`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version, blocks }),
    },
  );
  if (!isPlannerSaveAcknowledgement(value)) {
    throw new PlannerApiError("Trip service returned an invalid save acknowledgement.", 502);
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
        : `Planner request failed (${response.status}).`;
    throw new PlannerApiError(message, response.status);
  }
  return value;
}

function isPlannerSnapshot(value: unknown): value is PlannerSnapshot {
  return (
    isRecord(value) &&
    isPlannerBlocks(value.blocks) &&
    typeof value.version === "number" &&
    typeof value.savedAt === "string"
  );
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
    isNullableString(value.operatorName)
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
