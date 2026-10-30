import { atom, type SetStateAction } from "jotai";
import { activeVehicleAtom } from "../garage/garage.atoms";
import { getVehicleCar } from "../constants/vehicle.data";
import { isCompatible } from "../garage/ev-calculator";
import {
  findDayStopForAnchor,
  getDayEdgeStops,
  getDayPlacePositions,
  keepDayEdgeStopsInPlace,
  moveStopToDayEdge,
  placeItemToAnchor,
  resolveDayAnchors,
} from "../itinerary/day-anchors";
import { createPlaceVisit, getPlaceUsage } from "../itinerary/trip-location-markers";
import { getItemInsertionIndex, getItemInsertionLabel } from "../block/item-insertion";

import { currencyOptions, getCurrencyOption } from "../budget/budget.data";
import { roundMoney } from "../budget/budget.utils";
import {
  createPlaceExpenseId,
  getPlaceExpenses,
  getPlaceExpenseTotal,
  isExpenseForPlace,
  legacyPlaceExpenseId,
  reconcilePlaceExpenseCosts,
} from "../budget/place-expenses";
import type {
  CurrencyOption,
  ExpenseItem,
  TripBudgetState,
} from "../budget/budget.types";
import { getDistanceKm } from "../constants/place.data";
import { getTripBlockColorByIndex } from "../constants/trip-block-colors";
import { mockPremadeLists } from "../constants/trip.data";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type ActiveSearch,
  type ChecklistItem,
  type ChecklistSubItem,
  type EvCharger,
  type PlaceItem,
  type PlaceSearchResult,
  type PremadeList,
  type SectionItem,
  type TripAnchor,
  type TripBlockData,
  type TripBlockColorId,
  type TripBlockItem,
} from "../constants/types";
import { shiftSchedule } from "../itinerary/stop-schedule";

type AddPremadeListPayload = {
  blockId: string;
  listId: string;
};

type AddPremadeListToChecklistPayload = {
  blockId: string;
  itemId: string;
  listId: string;
};

type AddItemPayload = {
  blockId: string;
  beforeItemId?: string;
};

type RemoveItemPayload = {
  blockId: string;
  itemId: string;
};

type UpdateBlockTitlePayload = {
  blockId: string;
  title: string;
};

type UpdateBlockDatePayload = {
  blockId: string;
  date: string;
};

type UpdateBlockColorPayload = {
  blockId: string;
  colorId: TripBlockColorId;
};

export type DayAnchorEdge = "start" | "end";

type SetDayAnchorPayload = {
  blockId: string;
  edge: DayAnchorEdge;
  anchor: TripAnchor | null;
};

type UpdateSectionPayload = {
  blockId: string;
  itemId: string;
  updates: Partial<Pick<SectionItem, "title" | "colorId" | "destination">>;
};

type UpdateNotePayload = {
  blockId: string;
  itemId: string;
  content: string;
};

type UpdatePlacePayload = {
  blockId: string;
  itemId: string;
  updates: Partial<
    Pick<
      PlaceItem,
      "isVisited" | "notes" | "schedule" | "time" | "timeEnd" | "timeSource" | "cost" | "evCharger" | "observedSocCheckpoint" | "arrivalMode" | "arrivalRouteKey"
    >
  >;
};

type UpdateChecklistTitlePayload = {
  blockId: string;
  itemId: string;
  title: string;
};

type ChecklistSubItemPayload = {
  blockId: string;
  itemId: string;
  subItemId: string;
};

type UpdateChecklistSubItemPayload = ChecklistSubItemPayload & {
  updates: Partial<Pick<ChecklistSubItem, "checked" | "label">>;
};

type ReorderBlockItemsPayload = {
  blockId: string;
  activeItemId: string;
  overItemId: string;
};

type StartPlaceSearchPayload = {
  blockId: string;
  beforeItemId?: string;
  result?: PlaceSearchResult;
  results?: PlaceSearchResult[];
  query?: string;
  selectedIndex?: number;
};

type SelectSearchResultPayload = {
  index: number;
};

type StepSearchResultPayload = {
  direction: "next" | "previous";
};

type SelectTripPlacePayload = {
  itemId: string;
};

type AddEvChargerToBlockPayload = {
  blockId: string;
  beforeItemId?: string;
  charger: EvCharger;
};

export type TripPlaceAnchor = PlaceItem & {
  blockId: string;
  blockTitle: string;
  blockColorId: TripBlockColorId;
  placeSequence: number | null;
  isEvCharger: boolean;
};

export type EvChargerMapResult = {
  charger: EvCharger;
  targetBlockId: string;
  beforeItemId?: string;
  targetPlaceId: string;
  distanceKm: number;
};

export type ActivePlannerSidePanel = {
  type: "ev-stations";
  blockId: string;
  beforeItemId?: string;
  requestId?: string;
};

function createClientId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTodayDateValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sortBlocksByDate(blocks: TripBlockData[]): TripBlockData[] {
  return [...blocks].sort((a, b) => a.date.localeCompare(b.date));
}

function isItineraryBlock(block: TripBlockData): boolean {
  return block.kind !== "list";
}

/** Moves an ISO date by whole days without pulling in a timezone library. */
function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(shifted.getTime())) {
    return date;
  }
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Closes the gap left by a removed day.
 *
 * <p>Days are shown to the traveller as "Day 1, Day 2, Day 3", so removing the
 * middle of a five-day trip must produce four consecutive days rather than a
 * visible hole at day three — a hole is exactly what somebody reading a shared
 * copy of this trip would see as "missing day 3". Later days move one day
 * earlier and the trip ends a day sooner; stops, notes and anchors ride along
 * with their day untouched.
 */
function resequenceItineraryDays(
  blocks: TripBlockData[],
  removedBlock: TripBlockData | undefined,
): TripBlockData[] {
  if (!removedBlock || !isItineraryBlock(removedBlock)) {
    return blocks;
  }

  return blocks.map((block) => {
    if (!isItineraryBlock(block) || block.date <= removedBlock.date) {
      return block;
    }
    const date = shiftDate(block.date, -1);
    return {
      ...block,
      date,
      // Only auto-generated titles follow the date. A day the traveller named
      // keeps its name.
      title: block.title === block.date ? date : block.title,
    };
  });
}

function updateBlock(
  blocks: TripBlockData[],
  blockId: string,
  updater: (block: TripBlockData) => TripBlockData,
): TripBlockData[] {
  return blocks.map((block) => (block.id === blockId ? updater(block) : block));
}

function updateItem(
  blocks: TripBlockData[],
  blockId: string,
  itemId: string,
  updater: (item: TripBlockItem) => TripBlockItem,
): TripBlockData[] {
  return updateBlock(blocks, blockId, (block) => ({
    ...block,
    items: block.items.map((item) =>
      item.id === itemId ? updater(item) : item,
    ),
  }));
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function premadeListToChecklist(list: PremadeList): ChecklistItem {
  return {
    id: createClientId("checklist"),
    type: "checklist",
    title: list.title,
    items: list.items.map((label) => ({
      id: createClientId("checklist-item"),
      label,
      checked: false,
    })),
  };
}

function getChargerPlaceId(chargerId: string): string {
  return `ev-charger:${chargerId}`;
}

function getEvChargerDescription(charger: EvCharger): string {
  return `EV charging station - ${charger.connectorTypes.join(", ")} - up to ${charger.maxKw} kW`;
}

function getOpeningHoursSummary(openingHours: Record<string, unknown>) {
  const summary = openingHours.summary;
  return typeof summary === "string" ? summary : null;
}

function getEstimatedChargeMinutes(maxKw: number): number {
  if (maxKw >= 100) {
    return 35;
  }

  if (maxKw >= 50) {
    return 50;
  }

  if (maxKw >= 22) {
    return 90;
  }

  return 150;
}

function evChargerToPlaceItem(
  charger: EvCharger,
  placeId: string,
  estimatedChargeMinutes = getEstimatedChargeMinutes(charger.maxKw),
  selectionSource: "AUTO" | "MANUAL" = "MANUAL",
  locked = false,
): PlaceItem {
  return {
    id: placeId,
    type: "place",
    placeId: getChargerPlaceId(charger.id),
    name: charger.name,
    description: getEvChargerDescription(charger),
    address:
      charger.address ?? charger.location.address ?? "EV charging station",
    lat: charger.location.lat,
    lng: charger.location.lng,
    rating: charger.ratingAvg,
    reviewCount: charger.ratingCount,
    evCharger: {
      connectorTypes: charger.connectorTypes,
      maxKw: charger.maxKw,
      totalConnectors: charger.totalConnectors,
      availableConnectors: charger.availableConnectors,
      priceText: charger.priceText,
      openingHoursSummary: getOpeningHoursSummary(charger.openingHours),
      estimatedChargeMinutes,
      targetBatteryPct: 100,
      operatorName: charger.operatorName,
      selectionSource,
      locked,
    },
    isVisited: false,
  };
}

function getTripPlaceAnchors(
  blocks: TripBlockData[],
  options?: { includeEvChargers?: boolean },
): TripPlaceAnchor[] {
  const includeEvChargers = options?.includeEvChargers ?? true;
  const dayAnchors = resolveDayAnchors(blocks);

  return blocks.flatMap((block) => {
    const positions = getDayPlacePositions(block, !!dayAnchors.get(block.id)?.start);

    return block.items.filter(isPlaceItem).flatMap((item) => {
      const isEvCharger = isEvChargerPlaceItem(item);

      if (isEvCharger && !includeEvChargers) {
        return [];
      }

      return [
        {
          ...item,
          blockId: block.id,
          blockTitle: block.title,
          blockColorId: block.colorId,
          placeSequence: positions.get(item.id) ?? null,
          isEvCharger,
        },
      ];
    });
  });
}

export type TripDateRange = { from?: string; to?: string };
export type PlannerServerSnapshotUpdate = {
  energyState?: import("../garage/trip-energy-state").TripEnergyState | null;
  tripId: string;
  blocks: TripBlockData[];
  budget: TripBudgetState;
  version: number;
  savedAt: string;
};
export const tripDateRangeAtom = atom<TripDateRange>({});
/**
 * True when the planner renders someone else's published plan. Every editing
 * control reads it, so a shared plan is the planner itself with editing removed
 * rather than a second renderer that can drift from it.
 */
export const plannerReadOnlyAtom = atom(false);
const storedTripBlocksAtom = atom<TripBlockData[]>([]);
/**
 * Every write keeps each day's start and end stops at the edges of the day, so
 * no insert, drag or auto plan can route past where the day ends.
 */
export const tripBlocksAtom = atom(
  (get) => get(storedTripBlocksAtom),
  (get, set, update: SetStateAction<TripBlockData[]>) => {
    const previous = get(storedTripBlocksAtom);
    const next = typeof update === "function" ? update(previous) : update;
    set(storedTripBlocksAtom, keepDayEdgeStopsInPlace(previous, next));
  },
);
export const activePlannerKeyAtom = atom<string | null>(null);
export const itineraryBlocksAtom = atom<TripBlockData[]>((get) =>
  get(tripBlocksAtom).filter(isItineraryBlock),
);
export const myListBlocksAtom = atom<TripBlockData[]>((get) =>
  get(tripBlocksAtom).filter((block) => block.kind === "list" && !block.id.startsWith("starting-part-")),
);
export const tripCurrencyAtom = atom<CurrencyOption>(currencyOptions[0]);
export const tripExpensesAtom = atom<ExpenseItem[]>([]);
/** Expense edits from either the card or Budget also update that visit's total. */
export const updateTripExpensesAtom = atom(
  null,
  (get, set, update: ExpenseItem[] | ((previous: ExpenseItem[]) => ExpenseItem[])) => {
    if (get(plannerReadOnlyAtom)) return;
    const previous = get(tripExpensesAtom);
    const next = typeof update === "function" ? update(previous) : update;
    set(tripExpensesAtom, next);
    set(tripBlocksAtom, reconcilePlaceExpenseCosts(get(tripBlocksAtom), previous, next, get(tripCurrencyAtom).code));
  },
);

export const savePlaceExpenseAtom = atom(
  null,
  (get, set, payload: {
    blockId: string;
    itemId: string;
    expenseId?: string;
    amount: number;
    label: string;
    categoryId: string;
  }): boolean => {
    if (get(plannerReadOnlyAtom)) return false;
    const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
    const item = block?.items.find((entry) => entry.id === payload.itemId);
    if (!block || !item || !isPlaceItem(item)) return false;
    const amount = roundMoney(payload.amount, get(tripCurrencyAtom).code);
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const previous = get(tripExpensesAtom);
    const linked = getPlaceExpenses(previous, item.id);
    const legacy = !linked.length && item.cost !== undefined && item.cost > 0
      ? { id: legacyPlaceExpenseId(item.id), amount: item.cost, label: item.name, categoryId: "sightseeing", date: block.date }
      : undefined;
    const existing = [...linked, ...(legacy ? [legacy] : [])].find((expense) => expense.id === payload.expenseId);
    // A deleted expense must not be recreated by an old edit form.
    if (payload.expenseId && !existing) return false;
    const entry: ExpenseItem = {
      id: payload.expenseId ?? createPlaceExpenseId(item.id),
      amount,
      label: payload.label.trim() || item.name,
      categoryId: payload.categoryId,
      date: existing?.date ?? block.date,
    };
    const base = legacy ? [...previous, legacy] : previous;
    set(updateTripExpensesAtom, payload.expenseId
      ? base.map((expense) => expense.id === entry.id ? entry : expense)
      : [...base, entry]);
    return true;
  },
);

export const removePlaceExpenseAtom = atom(
  null,
  (get, set, payload: { blockId: string; itemId: string; expenseId: string }) => {
    if (get(plannerReadOnlyAtom)) return;
    const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
    const item = block?.items.find((entry) => entry.id === payload.itemId);
    if (!item || !isPlaceItem(item)) return;
    const expenses = get(tripExpensesAtom);
    const expense = expenses.find((entry) => entry.id === payload.expenseId);
    if (expense && isExpenseForPlace(expense, item.id)) {
      set(updateTripExpensesAtom, expenses.filter((entry) => entry.id !== expense.id));
    } else if (!expense && payload.expenseId === legacyPlaceExpenseId(item.id) && !getPlaceExpenses(expenses, item.id).length) {
      set(tripBlocksAtom, updateItem(get(tripBlocksAtom), payload.blockId, item.id, (entry) => ({ ...entry, cost: undefined })));
    }
  },
);
export const tripBudgetAtom = atom<number>(0);
export const activeBlockIdAtom = atom<string | null>(null);
// "day" draws only the active (scrolled-to) day's route; "all" draws every day's route;
// "stop" focuses the leg of the stop scrolled to and fades the rest of its day.
export type RouteLineMode = "day" | "all" | "stop";
export const routeLineModeAtom = atom<RouteLineMode>("day");
/** In "stop" mode, the stop whose leg is focused: an item id, or a day anchor id. */
export const focusedRouteStopIdAtom = atom<string | null>(null);
/** Switching modes clears the focused stop so scrolling picks it afresh. */
export const setRouteLineModeAtom = atom(null, (_get, set, mode: RouteLineMode) => {
  set(routeLineModeAtom, mode);
  set(focusedRouteStopIdAtom, null);
});
/** Focuses one leg directly (from its travel row), switching to "stop" mode. */
export const focusRouteLegAtom = atom(
  null,
  (_get, set, { blockId, stopId }: { blockId: string; stopId: string }) => {
    set(routeLineModeAtom, "stop");
    set(activeBlockIdAtom, blockId);
    set(focusedRouteStopIdAtom, stopId);
  },
);
export const activeSearchAtom = atom<ActiveSearch | null>(null);
export const activePlannerSidePanelAtom = atom<ActivePlannerSidePanel | null>(
  null,
);
export const openBlockIdsAtom = atom<string[]>([]);
export const evChargerResultsAtom = atom<EvChargerMapResult[]>([]);
export const compatibleChargersOnlyAtom = atom(false);
export const visibleEvChargerResultsAtom = atom((get) => {
  const results = get(evChargerResultsAtom);
  if (!get(compatibleChargersOnlyAtom)) return results;
  const vehicle = get(activeVehicleAtom);
  const car = vehicle ? getVehicleCar(vehicle) : null;
  return car ? results.filter(({ charger }) => isCompatible(car.connectorTypes, charger.connectorTypes)) : [];
});
export const selectedEvChargerIdAtom = atom<string | null>(null);
export const selectedTripPlaceItemIdAtom = atom<string | null>(null);
export const selectedTripPlaceItemIdReadonlyAtom = atom((get) =>
  get(selectedTripPlaceItemIdAtom),
);
export const evChargerLoadingAtom = atom(false);
export const evChargerErrorAtom = atom<string | null>(null);
export const plannerServerSnapshotUpdateAtom =
  atom<PlannerServerSnapshotUpdate | null>(null);

export const applyPlannerServerSnapshotAtom = atom(
  null,
  (_get, set, snapshot: PlannerServerSnapshotUpdate) => {
    set(tripBlocksAtom, snapshot.blocks);
    set(tripCurrencyAtom, getCurrencyOption(snapshot.budget.currency));
    set(tripBudgetAtom, snapshot.budget.amount);
    set(tripExpensesAtom, snapshot.budget.expenses);
    set(plannerServerSnapshotUpdateAtom, snapshot);
  },
);

export const convertTripCurrencyAtom = atom(
  null,
  (
    get,
    set,
    payload: { currency: CurrencyOption; rate: number },
  ) => {
    const currentCurrency = get(tripCurrencyAtom);
    if (currentCurrency.code === payload.currency.code) return;
    if (!Number.isFinite(payload.rate) || payload.rate <= 0) return;

    const convert = (amount: number) =>
      roundMoney(amount * payload.rate, payload.currency.code);

    set(tripBudgetAtom, convert(get(tripBudgetAtom)));
    const convertedExpenses = get(tripExpensesAtom).map((expense) => ({
      ...expense,
      amount: convert(expense.amount),
    }));
    set(tripExpensesAtom, convertedExpenses);
    set(
      tripBlocksAtom,
      get(tripBlocksAtom).map((block) => ({
        ...block,
        items: block.items.map((item) => {
          if (!isPlaceItem(item) || item.cost === undefined) return item;
          const linked = getPlaceExpenses(convertedExpenses, item.id);
          return { ...item, cost: linked.length
            ? getPlaceExpenseTotal(linked, payload.currency.code)
            : convert(item.cost) };
        }),
      })),
    );
    set(tripCurrencyAtom, payload.currency);
  },
);

export const toggleBlockOpenAtom = atom(null, (get, set, blockId: string) => {
  const openIds = get(openBlockIdsAtom);
  const isOpen = openIds.includes(blockId);
  set(
    openBlockIdsAtom,
    isOpen ? openIds.filter((id) => id !== blockId) : [...openIds, blockId],
  );
});

export const selectedTripPlacesAtom = atom((get) =>
  get(tripBlocksAtom).flatMap((block) => block.items.filter(isPlaceItem)),
);

export const selectedTripPlaceMarkersAtom = atom<TripPlaceAnchor[]>((get) =>
  getTripPlaceAnchors(get(tripBlocksAtom)),
);

export const selectedTripPlaceAnchorsAtom = atom<TripPlaceAnchor[]>((get) =>
  getTripPlaceAnchors(get(tripBlocksAtom), { includeEvChargers: false }),
);

export const selectedTripPlaceAtom = atom<TripPlaceAnchor | null>((get) => {
  const selectedItemId = get(selectedTripPlaceItemIdAtom);

  if (!selectedItemId) {
    return null;
  }

  return (
    getTripPlaceAnchors(get(tripBlocksAtom)).find(
      (item) => item.id === selectedItemId,
    ) ?? null
  );
});

export const selectedSearchPlaceAtom = atom((get) => {
  const activeSearch = get(activeSearchAtom);

  if (!activeSearch) {
    return null;
  }

  return activeSearch.results[activeSearch.selectedIndex] ?? null;
});

export const selectedSearchPlaceUsageAtom = atom((get) => {
  const activeSearch = get(activeSearchAtom);
  const selectedPlace = get(selectedSearchPlaceAtom);

  if (!activeSearch || !selectedPlace) {
    return { isAdded: false, label: undefined, targetLabel: undefined };
  }

  return getPlaceUsage(get(tripBlocksAtom), { ...selectedPlace, placeId: selectedPlace.id }, activeSearch.blockId);
});

export const selectedSearchPlaceIsAddedAtom = atom((get) => get(selectedSearchPlaceUsageAtom).isAdded);

export const selectedEvChargerInsertionAtom = atom((get) => {
  const result = get(selectedEvChargerResultAtom);
  const blocks = get(tripBlocksAtom);
  const block = blocks.find((entry) => entry.id === result?.targetBlockId);
  if (!result || !block) return { isValid: false, label: undefined, error: "Choose a day to add this station." };
  if (getItemInsertionIndex(block, result.beforeItemId) < 0) {
    return { isValid: false, label: undefined, error: "This spot was removed. Choose another spot." };
  }
  return {
    isValid: true,
    label: result.beforeItemId === undefined ? undefined : getItemInsertionLabel(
      block, result.beforeItemId, !!resolveDayAnchors(blocks).get(block.id)?.start,
    ),
    error: undefined,
  };
});

export const selectedSearchPlaceInsertionAtom = atom((get) => {
  const search = get(activeSearchAtom);
  const blocks = get(tripBlocksAtom);
  const block = blocks.find((entry) => entry.id === search?.blockId);
  if (!search || !block) return { isValid: false, label: undefined, error: "Choose a day to add this place." };
  if (getItemInsertionIndex(block, search.beforeItemId) < 0) {
    return { isValid: false, label: undefined, error: "This spot was removed. Choose another spot." };
  }
  return {
    isValid: true,
    label: search.beforeItemId === undefined ? undefined : getItemInsertionLabel(
      block, search.beforeItemId, !!resolveDayAnchors(blocks).get(block.id)?.start,
    ),
    error: undefined,
  };
});

export const selectedEvChargerResultAtom = atom((get) => {
  const selectedId = get(selectedEvChargerIdAtom);

  if (!selectedId) {
    return null;
  }

  return (
    get(visibleEvChargerResultsAtom).find(
      (result) => result.charger.id === selectedId,
    ) ?? null
  );
});

export const selectedEvChargerIsAddedAtom = atom((get) => {
  const selectedResult = get(selectedEvChargerResultAtom);

  if (!selectedResult) {
    return false;
  }

  const targetBlock = get(tripBlocksAtom).find(
    (block) => block.id === selectedResult.targetBlockId,
  );
  const chargerPlaceId = getChargerPlaceId(selectedResult.charger.id);

  return Boolean(
    targetBlock?.items.some(
      (item) => isPlaceItem(item) && item.placeId === chargerPlaceId,
    ),
  );
});

export const selectEvChargerAtom = atom(
  null,
  (_get, set, chargerId: string) => {
    set(activeSearchAtom, null);
    set(selectedTripPlaceItemIdAtom, null);
    set(selectedEvChargerIdAtom, chargerId);
  },
);

export const closeSelectedEvChargerAtom = atom(null, (_get, set) => {
  set(selectedEvChargerIdAtom, null);
});

export const setEvChargerResultsAtom = atom(
  null,
  (_get, set, results: EvChargerMapResult[]) => {
    set(evChargerResultsAtom, results);
    set(selectedEvChargerIdAtom, (selectedId) =>
      selectedId && results.some((result) => result.charger.id === selectedId)
        ? selectedId
        : null,
    );
  },
);

export const clearEvChargerResultsAtom = atom(null, (_get, set) => {
  set(evChargerResultsAtom, []);
  set(selectedEvChargerIdAtom, null);
  set(evChargerLoadingAtom, false);
  set(evChargerErrorAtom, null);
  set(activePlannerSidePanelAtom, null);
});

export const selectTripPlaceAtom = atom(
  null,
  (_get, set, payload: SelectTripPlacePayload) => {
    set(activeSearchAtom, null);
    set(selectedEvChargerIdAtom, null);
    set(selectedTripPlaceItemIdAtom, payload.itemId);
  },
);

export const closeSelectedTripPlaceAtom = atom(null, (_get, set) => {
  set(selectedTripPlaceItemIdAtom, null);
});

export function dedupeEvChargerResults(
  chargersByAnchor: Array<{
    anchor: TripPlaceAnchor;
    chargers: EvCharger[];
  }>,
): EvChargerMapResult[] {
  const byChargerId = new Map<string, EvChargerMapResult>();

  chargersByAnchor.forEach(({ anchor, chargers }) => {
    chargers.forEach((charger) => {
      const distanceKm = getDistanceKm(
        { lat: anchor.lat, lng: anchor.lng },
        charger.location,
      );
      const nextResult: EvChargerMapResult = {
        charger,
        targetBlockId: anchor.blockId,
        targetPlaceId: anchor.id,
        distanceKm,
      };
      const existing = byChargerId.get(charger.id);

      if (!existing || nextResult.distanceKm < existing.distanceKm) {
        byChargerId.set(charger.id, nextResult);
      }
    });
  });

  return [...byChargerId.values()].sort((a, b) => a.distanceKm - b.distanceKm);
}

export const addTripBlockAtom = atom(null, (get, set) => {
  const blocks = get(tripBlocksAtom);
  const itineraryBlocks = blocks.filter(isItineraryBlock);
  const todayDateValue = getTodayDateValue();
  const nextBlock: TripBlockData = {
    id: createClientId("block"),
    kind: "itinerary",
    title: todayDateValue,
    date: todayDateValue,
    colorId: getTripBlockColorByIndex(itineraryBlocks.length),
    items: [],
  };

  set(tripBlocksAtom, sortBlocksByDate([...blocks, nextBlock]));
  set(activeBlockIdAtom, nextBlock.id);
  set(openBlockIdsAtom, [...get(openBlockIdsAtom), nextBlock.id]);
});

export const addMyListBlockAtom = atom(null, (get, set) => {
  const blocks = get(tripBlocksAtom);
  const listBlocks = blocks.filter((block) => block.kind === "list");
  const todayDateValue = getTodayDateValue();
  const nextBlock: TripBlockData = {
    id: createClientId("list"),
    kind: "list",
    title: "",
    date: todayDateValue,
    colorId: getTripBlockColorByIndex(listBlocks.length),
    items: [],
  };

  set(tripBlocksAtom, [nextBlock, ...blocks]);
  set(activeBlockIdAtom, nextBlock.id);
  set(openBlockIdsAtom, [...get(openBlockIdsAtom), nextBlock.id]);
  return nextBlock.id;
});

export const addTripBlocksForDatesAtom = atom(
  null,
  (get, set, dates: string[]) => {
    const blocks = get(tripBlocksAtom);
    const itineraryBlocks = blocks.filter(isItineraryBlock);
    const newBlocks: TripBlockData[] = dates
      .filter((date) => !itineraryBlocks.some((b) => b.date === date))
      .map((date, i) => ({
        id: createClientId("block"),
        kind: "itinerary",
        title: date,
        date,
        colorId: getTripBlockColorByIndex(itineraryBlocks.length + i),
        items: [],
      }));

    if (newBlocks.length === 0) return;

    set(tripBlocksAtom, sortBlocksByDate([...blocks, ...newBlocks]));
    set(openBlockIdsAtom, [
      ...get(openBlockIdsAtom),
      ...newBlocks.map((b) => b.id),
    ]);
    set(activeBlockIdAtom, newBlocks[0]?.id ?? get(activeBlockIdAtom));
  },
);

export const updateBlockTitleAtom = atom(
  null,
  (get, set, payload: UpdateBlockTitlePayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        title: payload.title,
      })),
    );
  },
);

export const updateBlockDateAtom = atom(
  null,
  (get, set, payload: UpdateBlockDatePayload) => {
    set(
      tripBlocksAtom,
      sortBlocksByDate(
        updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
          ...block,
          title: block.kind === "list" ? block.title : payload.date,
          date: payload.date,
        })),
      ),
    );
  },
);

export const setDayAnchorAtom = atom(
  null,
  (get, set, payload: SetDayAnchorPayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => {
        const next = {
          ...block,
          // null clears the override so the day falls back to where the previous
          // one ended; undefined would leave the old value in place on merge.
          [payload.edge === "start" ? "startAnchor" : "endAnchor"]: payload.anchor,
        };
        if (!payload.anchor) return next;
        // A place the day already visits becomes that stop's role rather than
        // a second visit, so it keeps its time, notes and expenses.
        const stopId = findDayStopForAnchor(next, payload.anchor, payload.edge);
        return stopId ? { ...next, items: moveStopToDayEdge(next.items, stopId, payload.edge) } : next;
      }),
    );
  },
);

export const updateBlockColorAtom = atom(
  null,
  (get, set, payload: UpdateBlockColorPayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        colorId: payload.colorId,
      })),
    );
  },
);

export type RemoveTripBlockResult = {
  /** The shortened trip end date, when a day was removed and dates shifted. */
  endDate?: string;
};

export const removeTripBlockAtom = atom(null, (get, set, blockId: string): RemoveTripBlockResult => {
  const blocks = get(tripBlocksAtom);
  const removedBlock = blocks.find((block) => block.id === blockId);
  const nextBlocks = resequenceItineraryDays(
    blocks.filter((block) => block.id !== blockId),
    removedBlock,
  );
  const activeBlockId = get(activeBlockIdAtom);
  const selectedItemId = get(selectedTripPlaceItemIdAtom);
  const activeSearch = get(activeSearchAtom);
  const selectedEvChargerResult = get(selectedEvChargerResultAtom);

  set(tripBlocksAtom, nextBlocks);
  if (removedBlock) {
    set(tripExpensesAtom, (expenses) => expenses.filter((expense) =>
      !removedBlock.items.some((item) => isExpenseForPlace(expense, item.id)),
    ));
  }
  // Removing a middle day shortens the trip by a day rather than leaving a hole
  // in the date range. The caller persists the returned endDate: without it,
  // ensureItineraryDays rehydrates from the server's old range on the next load
  // and puts the empty day straight back.
  let endDate: string | undefined;
  if (removedBlock && isItineraryBlock(removedBlock)) {
    const range = get(tripDateRangeAtom);
    if (range.to) {
      endDate = shiftDate(range.to, -1);
      set(tripDateRangeAtom, { ...range, to: endDate });
    }
  }
  set(
    openBlockIdsAtom,
    get(openBlockIdsAtom).filter((id) => id !== blockId),
  );

  if (activeBlockId === blockId) {
    set(activeBlockIdAtom, nextBlocks[0]?.id ?? null);
  }

  if (removedBlock?.items.some((item) => item.id === selectedItemId)) {
    set(selectedTripPlaceItemIdAtom, null);
  }

  if (activeSearch?.blockId === blockId) {
    set(activeSearchAtom, null);
  }

  if (selectedEvChargerResult?.targetBlockId === blockId) {
    set(selectedEvChargerIdAtom, null);
  }

  set(
    evChargerResultsAtom,
    get(evChargerResultsAtom).filter(
      (result) => result.targetBlockId !== blockId,
    ),
  );

  return { endDate };
});

export const addNoteToBlockAtom = atom(
  null,
  (get, set, payload: AddItemPayload) => {
    if (get(plannerReadOnlyAtom)) return;
    const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
    if (!block) return;
    const index = getItemInsertionIndex(block, payload.beforeItemId);
    if (index < 0) return;
    const id = createClientId("note");
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        items: [
          ...block.items.slice(0, index),
          {
            id,
            type: "note",
            content: "",
          },
          ...block.items.slice(index),
        ],
      })),
    );
    return id;
  },
);

/** Starts a new part of the day at the chosen gap; the stops after it join it. */
export const addSectionToBlockAtom = atom(
  null,
  (get, set, payload: AddItemPayload) => {
    if (get(plannerReadOnlyAtom)) return;
    const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
    if (!block) return;
    const index = getItemInsertionIndex(block, payload.beforeItemId);
    if (index < 0) return;
    const id = createClientId("section");
    const section: SectionItem = { id, type: "section", title: "", colorId: null, destination: null };
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (current) => ({
        ...current,
        items: [...current.items.slice(0, index), section, ...current.items.slice(index)],
      })),
    );
    return id;
  },
);

export const updateSectionItemAtom = atom(
  null,
  (get, set, payload: UpdateSectionPayload) => {
    if (get(plannerReadOnlyAtom)) return;
    set(
      tripBlocksAtom,
      updateItem(get(tripBlocksAtom), payload.blockId, payload.itemId, (item) =>
        item.type === "section" ? { ...item, ...payload.updates } : item,
      ),
    );
  },
);

export const addChecklistToBlockAtom = atom(
  null,
  (get, set, payload: AddItemPayload) => {
    if (get(plannerReadOnlyAtom)) return;
    const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
    if (!block) return;
    const index = getItemInsertionIndex(block, payload.beforeItemId);
    if (index < 0) return;
    const id = createClientId("checklist");
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        items: [
          ...block.items.slice(0, index),
          {
            id,
            type: "checklist",
            title: "Add title",
            items: [
              {
                id: createClientId("checklist-item"),
                label: "",
                checked: false,
              },
            ],
          },
          ...block.items.slice(index),
        ],
      })),
    );
    return id;
  },
);

export const addPremadeListToBlockAtom = atom(
  null,
  (get, set, payload: AddPremadeListPayload) => {
    const selectedList = mockPremadeLists.find(
      (list) => list.id === payload.listId,
    );

    if (!selectedList) {
      console.error("Premade list was not found.", {
        component: "TripBuilder",
        operation: "addPremadeListToBlock",
        listId: payload.listId,
      });
      return;
    }

    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
        ...block,
        items: [...block.items, premadeListToChecklist(selectedList)],
      })),
    );
  },
);

export const addPremadeListToChecklistAtom = atom(
  null,
  (get, set, payload: AddPremadeListToChecklistPayload) => {
    const selectedList = mockPremadeLists.find(
      (list) => list.id === payload.listId,
    );

    if (!selectedList) {
      console.error("Premade list was not found.", {
        component: "TripBuilder",
        operation: "addPremadeListToChecklist",
        listId: payload.listId,
      });
      return;
    }

    const newSubItems = selectedList.items.map((label) => ({
      id: createClientId("checklist-item"),
      label,
      checked: false,
    }));

    set(
      tripBlocksAtom,
      updateItem(
        get(tripBlocksAtom),
        payload.blockId,
        payload.itemId,
        (item) => {
          if (item.type !== "checklist") return item;
          const hasTitle =
            item.title.trim() !== "" && item.title !== "Add title";
          return {
            ...item,
            title: hasTitle ? item.title : selectedList.title,
            items: [...item.items, ...newSubItems],
          };
        },
      ),
    );
  },
);

export const removeItemFromBlockAtom = atom(
  null,
  (get, set, payload: RemoveItemPayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => {
        const edges = getDayEdgeStops(block);
        return {
          ...block,
          // Deleting the start or end stop deletes that choice too, instead of
          // leaving a bare card for a place the day no longer visits.
          ...(edges.startStopId === payload.itemId ? { startAnchor: null } : {}),
          ...(edges.endStopId === payload.itemId ? { endAnchor: null } : {}),
          items: block.items.filter((item) => item.id !== payload.itemId),
        };
      }),
    );
    set(tripExpensesAtom, (prev) =>
      prev.filter((expense) => !isExpenseForPlace(expense, payload.itemId)),
    );
  },
);

type DayEdgeStopPayload = RemoveItemPayload & { edge: DayAnchorEdge };

/**
 * Makes a stop the place the day starts or ends at.
 *
 * The stop stays a full card with its time, notes and expenses, and moves to
 * the top or bottom of the day. Its place also becomes where the next day
 * starts when it is the end.
 */
export const markPlaceAsDayEdgeAtom = atom(
  null,
  (get, set, payload: DayEdgeStopPayload) => {
    const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
    const item = block?.items.find((entry) => entry.id === payload.itemId);
    if (!block || block.kind !== "itinerary" || !item || !isPlaceItem(item) || isEvChargerPlaceItem(item)) {
      return;
    }
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (current) => ({
        ...current,
        [payload.edge === "start" ? "startAnchor" : "endAnchor"]: placeItemToAnchor(item),
        items: moveStopToDayEdge(current.items, item.id, payload.edge),
      })),
    );
  },
);

/** Turns a start or end stop back into an ordinary stop; the day falls back to its previous start or end. */
export const clearDayEdgeStopAtom = atom(
  null,
  (get, set, payload: RemoveItemPayload) => {
    const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
    if (!block) return;
    const edges = getDayEdgeStops(block);
    const edge = edges.startStopId === payload.itemId ? "start" : edges.endStopId === payload.itemId ? "end" : null;
    if (edge) set(setDayAnchorAtom, { blockId: payload.blockId, edge, anchor: null });
  },
);

export const updateNoteItemAtom = atom(
  null,
  (get, set, payload: UpdateNotePayload) => {
    set(
      tripBlocksAtom,
      updateItem(
        get(tripBlocksAtom),
        payload.blockId,
        payload.itemId,
        (item) =>
          item.type === "note" ? { ...item, content: payload.content } : item,
      ),
    );
  },
);

export const updatePlaceItemAtom = atom(
  null,
  (get, set, payload: UpdatePlacePayload) => {
    set(
      tripBlocksAtom,
      updateItem(
        get(tripBlocksAtom),
        payload.blockId,
        payload.itemId,
        (item) => {
          if (item.type !== "place") return item;
          const updated = { ...item, ...payload.updates };
          // A new start time carries the stop's own schedule with it, unless the schedule is being set too.
          if (!("time" in payload.updates) || "schedule" in payload.updates || !item.schedule?.length) return updated;
          return { ...updated, schedule: [...shiftSchedule(item.schedule, item.time, payload.updates.time)] };
        },
      ),
    );
  },
);

export const updateChecklistTitleAtom = atom(
  null,
  (get, set, payload: UpdateChecklistTitlePayload) => {
    set(
      tripBlocksAtom,
      updateItem(
        get(tripBlocksAtom),
        payload.blockId,
        payload.itemId,
        (item) =>
          item.type === "checklist" ? { ...item, title: payload.title } : item,
      ),
    );
  },
);

export const addChecklistSubItemAtom = atom(
  null,
  (get, set, payload: RemoveItemPayload) => {
    set(
      tripBlocksAtom,
      updateItem(
        get(tripBlocksAtom),
        payload.blockId,
        payload.itemId,
        (item) =>
          item.type === "checklist"
            ? {
                ...item,
                items: [
                  ...item.items,
                  {
                    id: createClientId("checklist-item"),
                    label: "",
                    checked: false,
                  },
                ],
              }
            : item,
      ),
    );
  },
);

export const updateChecklistSubItemAtom = atom(
  null,
  (get, set, payload: UpdateChecklistSubItemPayload) => {
    set(
      tripBlocksAtom,
      updateItem(
        get(tripBlocksAtom),
        payload.blockId,
        payload.itemId,
        (item) =>
          item.type === "checklist"
            ? {
                ...item,
                items: item.items.map((subItem) =>
                  subItem.id === payload.subItemId
                    ? { ...subItem, ...payload.updates }
                    : subItem,
                ),
              }
            : item,
      ),
    );
  },
);

export const removeChecklistSubItemAtom = atom(
  null,
  (get, set, payload: ChecklistSubItemPayload) => {
    set(
      tripBlocksAtom,
      updateItem(
        get(tripBlocksAtom),
        payload.blockId,
        payload.itemId,
        (item) =>
          item.type === "checklist"
            ? {
                ...item,
                items: item.items.filter(
                  (subItem) => subItem.id !== payload.subItemId,
                ),
              }
            : item,
      ),
    );
  },
);

export const reorderBlockItemsAtom = atom(
  null,
  (get, set, payload: ReorderBlockItemsPayload) => {
    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => {
        const fromIndex = block.items.findIndex(
          (item) => item.id === payload.activeItemId,
        );
        const toIndex = block.items.findIndex(
          (item) => item.id === payload.overItemId,
        );

        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
          return block;
        }

        return {
          ...block,
          items: moveItem(block.items, fromIndex, toIndex),
        };
      }),
    );
  },
);

export const startPlaceSearchAtom = atom(
  null,
  (_get, set, payload: StartPlaceSearchPayload) => {
    const results = payload.results ?? (payload.result ? [payload.result] : []);

    if (!results.length) {
      return;
    }

    const selectedIndex = Math.min(
      Math.max(payload.selectedIndex ?? 0, 0),
      results.length - 1,
    );

    set(activeBlockIdAtom, payload.blockId);
    set(selectedEvChargerIdAtom, null);
    set(selectedTripPlaceItemIdAtom, null);
    set(activeSearchAtom, {
      blockId: payload.blockId,
      beforeItemId: payload.beforeItemId,
      query: payload.query ?? payload.result?.name ?? results[0]?.name ?? "",
      results,
      selectedIndex,
    });
  },
);

export const selectSearchResultAtom = atom(
  null,
  (get, set, payload: SelectSearchResultPayload) => {
    const activeSearch = get(activeSearchAtom);

    if (!activeSearch || !activeSearch.results.length) {
      return;
    }

    const lastIndex = activeSearch.results.length - 1;
    const nextIndex = Math.min(Math.max(payload.index, 0), lastIndex);

    set(selectedEvChargerIdAtom, null);
    set(selectedTripPlaceItemIdAtom, null);
    set(activeSearchAtom, {
      ...activeSearch,
      selectedIndex: nextIndex,
    });
  },
);

export const stepSearchResultAtom = atom(
  null,
  (get, set, payload: StepSearchResultPayload) => {
    const activeSearch = get(activeSearchAtom);

    if (!activeSearch || !activeSearch.results.length) {
      return;
    }

    const lastIndex = activeSearch.results.length - 1;
    const selectedIndex =
      payload.direction === "next"
        ? activeSearch.selectedIndex >= lastIndex
          ? 0
          : activeSearch.selectedIndex + 1
        : activeSearch.selectedIndex <= 0
          ? lastIndex
          : activeSearch.selectedIndex - 1;

    set(activeSearchAtom, {
      ...activeSearch,
      selectedIndex,
    });
  },
);

export const closeActiveSearchAtom = atom(null, (_get, set) => {
  set(activeSearchAtom, null);
});

export const closeSelectedSearchPlaceAtom = atom(null, (get, set) => {
  const activeSearch = get(activeSearchAtom);

  if (!activeSearch) {
    return;
  }

  set(activeSearchAtom, {
    ...activeSearch,
    selectedIndex: -1,
  });
});

export const addPlaceVisitToBlockAtom = atom(null, (get, set, payload: {
  blockId: string;
  beforeItemId?: string;
  place: Parameters<typeof createPlaceVisit>[0];
}) => {
  if (get(plannerReadOnlyAtom)) return;
  const targetBlock = get(tripBlocksAtom).find((block) => block.id === payload.blockId);
  if (!targetBlock) return;
  const insertionIndex = getItemInsertionIndex(targetBlock, payload.beforeItemId);
  if (insertionIndex < 0) return;
  // No time yet, but calculated: the day fills in a suggested time once its travel is known.
  const visit: PlaceItem = { ...createPlaceVisit(payload.place, createClientId("place")), timeSource: "calculated" };
  set(tripBlocksAtom, updateBlock(get(tripBlocksAtom), payload.blockId, (block) => ({
    ...block, items: [
      ...block.items.slice(0, insertionIndex), visit, ...block.items.slice(insertionIndex),
    ],
  })));
  set(activeBlockIdAtom, payload.blockId);
  set(openBlockIdsAtom, (ids) => ids.includes(payload.blockId) ? ids : [...ids, payload.blockId]);
  set(activeSearchAtom, null);
  set(selectedTripPlaceItemIdAtom, visit.id);
  return visit.id;
});

export const addSelectedPlaceToTripAtom = atom(null, (get, set) => {
  const activeSearch = get(activeSearchAtom);
  const selectedPlace = get(selectedSearchPlaceAtom);

  if (!activeSearch || !selectedPlace) {
    return;
  }

  return set(addPlaceVisitToBlockAtom, {
    blockId: activeSearch.blockId,
    beforeItemId: activeSearch.beforeItemId,
    place: { ...selectedPlace, placeId: selectedPlace.id, placeType: selectedPlace.primaryType },
  });
});

export const addEvChargerToBlockAtom = atom(
  null,
  (get, set, payload: AddEvChargerToBlockPayload) => {
    if (get(plannerReadOnlyAtom)) return;
    const chargerPlaceId = getChargerPlaceId(payload.charger.id);
    const targetBlock = get(tripBlocksAtom).find(
      (block) => block.id === payload.blockId,
    );
    if (!targetBlock) return;
    const index = getItemInsertionIndex(targetBlock, payload.beforeItemId);
    if (index < 0) return;
    const existingPlace = targetBlock?.items.find(
      (item) => isPlaceItem(item) && item.placeId === chargerPlaceId,
    );
    const nextPlaceId = existingPlace?.id ?? createClientId("place");

    set(
      tripBlocksAtom,
      updateBlock(get(tripBlocksAtom), payload.blockId, (block) => {
        const isAlreadyAdded = block.items.some(
          (item) => isPlaceItem(item) && item.placeId === chargerPlaceId,
        );

        if (isAlreadyAdded) {
          return block;
        }

        return {
          ...block,
          items: [
            ...block.items.slice(0, index),
            evChargerToPlaceItem(payload.charger, nextPlaceId),
            ...block.items.slice(index),
          ],
        };
      }),
    );
    set(activeSearchAtom, null);
    set(selectedEvChargerIdAtom, null);
    set(selectedTripPlaceItemIdAtom, nextPlaceId);
    return nextPlaceId;
  },
);

export const addSelectedEvChargerToTripAtom = atom(null, (get, set) => {
  const selectedResult = get(selectedEvChargerResultAtom);

  if (!selectedResult) {
    return;
  }

  return set(addEvChargerToBlockAtom, {
    blockId: selectedResult.targetBlockId,
    beforeItemId: selectedResult.beforeItemId,
    charger: selectedResult.charger,
  });
});
