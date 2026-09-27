import { getTripBlockColorByIndex } from "../../planId/_components/constants/trip-block-colors";
import type {
  EvConnectorType,
  PlaceItemEvChargerDetails,
  TripBlockData,
  TripBlockItem,
} from "../../planId/_components/constants/types";
import type { TripBudgetState, CurrencyCode } from "../../planId/_components/budget/budget.types";
import type { PublicCharger, PublicItem, PublicPlanSnapshot } from "./publication-api";

/**
 * Turns a published snapshot into the planner's own block model, so a shared
 * plan renders through the planner components instead of a parallel copy of them.
 *
 * <p>Ids are derived from position: the snapshot has none of the owner's ids,
 * and must not, so the result is stable only for a given snapshot.
 */

const CONNECTOR_TYPES: readonly EvConnectorType[] = ["CCS1", "CCS2", "CHADEMO", "TYPE2", "J1772", "NACS", "GB_T", "OTHER"];
const CURRENCY_CODES: readonly CurrencyCode[] = ["THB", "USD", "EUR", "JPY"];
const EV_CHARGER_PLACE_PREFIX = "ev-charger:";

function isConnectorType(value: string): value is EvConnectorType {
  return (CONNECTOR_TYPES as readonly string[]).includes(value);
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isLocatedStop(item: PublicItem): boolean {
  return (item.type === "place" || item.type === "charger") && isFiniteNumber(item.lat) && isFiniteNumber(item.lng);
}

function toChargerDetails(charger: PublicCharger | undefined): PlaceItemEvChargerDetails {
  return {
    connectorTypes: (charger?.connectorTypes ?? []).filter(isConnectorType),
    maxKw: charger?.maxKw ?? 0,
    totalConnectors: charger?.totalConnectors ?? 0,
    availableConnectors: null,
    priceText: charger?.priceText ?? null,
    openingHoursSummary: charger?.openingHoursSummary ?? null,
    estimatedChargeMinutes: 0,
    operatorName: charger?.operatorName ?? null,
  };
}

function toItem(item: PublicItem, id: string): TripBlockItem | null {
  if (item.type === "note") {
    return item.noteContent ? { id, type: "note", content: item.noteContent } : null;
  }
  if (item.type === "checklist") {
    return {
      id,
      type: "checklist",
      title: item.checklistTitle ?? "Checklist",
      items: (item.checklistLabels ?? []).map((label, index) => ({ id: `${id}-check-${index}`, label, checked: false })),
    };
  }
  if (item.type !== "place" && item.type !== "charger") return null;

  const name = item.name ?? "Planned stop";
  const { lat, lng } = item;
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    // Published before stops carried a location. It can still be read, but it
    // cannot be a map stop, so it reads as a note until the owner updates.
    return { id, type: "note", content: `${name} (location not shared)` };
  }

  const isCharger = item.type === "charger";
  const providerId = item.placeId ?? id;
  return {
    id,
    type: "place",
    // The planner recognises a charging stop by this prefix.
    placeId: isCharger && !providerId.startsWith(EV_CHARGER_PLACE_PREFIX) ? `${EV_CHARGER_PLACE_PREFIX}${providerId}` : providerId,
    name,
    description: item.description,
    address: item.address ?? "",
    lat,
    lng,
    rating: item.rating,
    reviewCount: item.reviewCount,
    imageUrl: item.imageUrl,
    notes: item.notes,
    time: item.time,
    timeEnd: item.timeEnd,
    cost: item.cost,
    evCharger: isCharger ? toChargerDetails(item.charger) : undefined,
  };
}

export function toSharedPlanBlocks(plan: PublicPlanSnapshot): TripBlockData[] {
  return (plan.days ?? []).map((day, dayIndex) => {
    const blockId = `shared-day-${dayIndex + 1}`;
    return {
      id: blockId,
      kind: "itinerary",
      title: day.label,
      date: day.date ?? "",
      colorId: getTripBlockColorByIndex(dayIndex),
      items: (day.items ?? []).flatMap((item, itemIndex) => {
        const mapped = toItem(item, `${blockId}-item-${itemIndex + 1}`);
        return mapped ? [mapped] : [];
      }),
    };
  });
}

export function toSharedPlanBudget(plan: PublicPlanSnapshot): TripBudgetState {
  const budget = plan.budget;
  return {
    currency: budget && isCurrencyCode(budget.currency) ? budget.currency : "THB",
    amount: isFiniteNumber(budget?.amount) ? budget.amount : 0,
    expenses: (budget?.expenses ?? []).map((expense, index) => ({
      id: `shared-expense-${index + 1}`,
      amount: isFiniteNumber(expense.amount) ? expense.amount : 0,
      label: expense.label,
      categoryId: expense.categoryId ?? "other",
    })),
  };
}

/** Where the map opens: the middle of the located stops, or Bangkok when there are none. */
export function getSharedPlanCenter(blocks: TripBlockData[]): { lat: number; lng: number } {
  const stops = blocks.flatMap((block) => block.items.flatMap((item) => (item.type === "place" ? [item] : [])));
  if (!stops.length) return { lat: 13.7563, lng: 100.5018 };
  return {
    lat: stops.reduce((sum, stop) => sum + stop.lat, 0) / stops.length,
    lng: stops.reduce((sum, stop) => sum + stop.lng, 0) / stops.length,
  };
}
