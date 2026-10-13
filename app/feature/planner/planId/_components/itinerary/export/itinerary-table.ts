import { format, isValid, parseISO } from "date-fns";

import { getExpenseCategory } from "../../budget/budget.data";
import type { CurrencyCode, ExpenseItem } from "../../budget/budget.types";
import { roundMoney } from "../../budget/budget.utils";
import { getPlaceExpenses } from "../../budget/place-expenses";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type PlaceItem,
  type TripBlockColorId,
  type TripBlockData,
} from "../../constants/types";

/** Where a day starts or ends, by name; shared plans carry no position. */
export type ItineraryTableAnchor = { name: string; address?: string };

export type ItineraryTableAnchors = {
  start: ItineraryTableAnchor | null;
  end: ItineraryTableAnchor | null;
};

export type ItineraryTableStopKind = "start" | "place" | "charger" | "end";

export type ItineraryTableExpense = {
  label: string;
  categoryId: string;
  categoryLabel: string;
  amount: number;
};

export type ItineraryTableRow = {
  id: string;
  kind: ItineraryTableStopKind;
  /** "9:00 AM – 10:30 AM", "9:00 AM", or null when the stop has no time. */
  time: string | null;
  name: string;
  address: string;
  /** EV charging plan, e.g. "About 45 min, charge to 80%". */
  chargeDetail: string | null;
  notes: string;
  expenses: ItineraryTableExpense[];
  /** Sum of the stop's expenses, or its stored cost when no expense entry is linked. */
  total: number | null;
};

export type ItineraryTableDay = {
  id: string;
  /** Position in the trip, counting from 1, matching the itinerary's day numbers. */
  number: number;
  /** ISO yyyy-MM-dd, or "" for published days without a date. */
  date: string;
  colorId: TripBlockColorId;
  rows: ItineraryTableRow[];
  total: number;
};

export type ItineraryTable = {
  currency: CurrencyCode;
  days: ItineraryTableDay[];
  total: number;
};

export type BuildItineraryTableInput = {
  blocks: TripBlockData[];
  expenses: ExpenseItem[];
  currency: CurrencyCode;
  anchors: ReadonlyMap<string, ItineraryTableAnchors>;
  /** Days to include; every itinerary day when omitted. */
  dayIds?: ReadonlySet<string>;
};

export function formatTableTime(time: string): string {
  const [hourText, minuteText = "00"] = time.split(":");
  const hour = Number(hourText);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return time;
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minuteText.padStart(2, "0")} ${period}`;
}

function formatTimeRange(time: string | undefined, timeEnd: string | undefined): string | null {
  if (!time) return null;
  return timeEnd ? `${formatTableTime(time)} – ${formatTableTime(timeEnd)}` : formatTableTime(time);
}

/** "Mon, Dec 22", or "" when the day has no usable date. */
export function formatTableDate(date: string): string {
  if (!date) return "";
  const parsed = parseISO(date);
  return isValid(parsed) ? format(parsed, "EEE, MMM d") : "";
}

function formatChargeDetail(item: PlaceItem): string | null {
  const charger = item.evCharger;
  if (!charger) return null;
  const parts = [
    charger.estimatedChargeMinutes ? `About ${Math.round(charger.estimatedChargeMinutes)} min` : null,
    charger.targetBatteryPct ? `charge to ${Math.round(charger.targetBatteryPct)}%` : null,
  ].filter((part): part is string => part !== null);
  return parts.length ? parts.join(", ") : null;
}

function toPlaceRow(item: PlaceItem, expenses: ExpenseItem[], currency: CurrencyCode): ItineraryTableRow {
  const linked = getPlaceExpenses(expenses, item.id).filter((expense) => Number.isFinite(expense.amount));
  const rowExpenses = linked.map((expense) => ({
    label: expense.label.trim() || getExpenseCategory(expense.categoryId).label,
    categoryId: expense.categoryId,
    categoryLabel: getExpenseCategory(expense.categoryId).label,
    amount: expense.amount,
  }));
  // Older and published snapshots keep only a total on the stop itself.
  const fallbackCost = typeof item.cost === "number" && Number.isFinite(item.cost) && item.cost > 0 ? item.cost : null;
  const total = rowExpenses.length
    ? roundMoney(rowExpenses.reduce((sum, expense) => sum + expense.amount, 0), currency)
    : fallbackCost;
  const isCharger = isEvChargerPlaceItem(item);

  return {
    id: item.id,
    kind: isCharger ? "charger" : "place",
    time: formatTimeRange(item.time, item.timeEnd),
    name: item.name.trim() || (isCharger ? "Charging stop" : "Planned stop"),
    address: item.address?.trim() ?? "",
    chargeDetail: isCharger ? formatChargeDetail(item) : null,
    notes: item.notes?.trim() ?? "",
    expenses: rowExpenses,
    total,
  };
}

function toAnchorRow(dayId: string, kind: "start" | "end", anchor: ItineraryTableAnchor): ItineraryTableRow {
  return {
    id: `${dayId}:${kind}`,
    kind,
    time: null,
    name: anchor.name,
    address: anchor.address?.trim() ?? "",
    chargeDetail: null,
    notes: "",
    expenses: [],
    total: null,
  };
}

/**
 * Flattens the itinerary into the rows an exported table shows.
 *
 * Places and charging stops keep their itinerary order between the day's start
 * and end. Note and checklist items are left out: the table is a schedule of
 * where the traveller goes and what it costs.
 */
export function buildItineraryTable({ blocks, expenses, currency, anchors, dayIds }: BuildItineraryTableInput): ItineraryTable {
  const days = blocks
    .filter((block) => block.kind === "itinerary")
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .flatMap((block, index): ItineraryTableDay[] => {
      if (dayIds && !dayIds.has(block.id)) return [];
      const dayAnchors = anchors.get(block.id);
      const rows = [
        ...(dayAnchors?.start ? [toAnchorRow(block.id, "start", dayAnchors.start)] : []),
        ...block.items.filter(isPlaceItem).map((item) => toPlaceRow(item, expenses, currency)),
        ...(dayAnchors?.end ? [toAnchorRow(block.id, "end", dayAnchors.end)] : []),
      ];
      const total = roundMoney(rows.reduce((sum, row) => sum + (row.total ?? 0), 0), currency);
      return [{ id: block.id, number: index + 1, date: block.date, colorId: block.colorId, rows, total }];
    });

  return {
    currency,
    days,
    total: roundMoney(days.reduce((sum, day) => sum + day.total, 0), currency),
  };
}

/** Day label used by every export, e.g. "Day 2". */
export function getTableDayLabel(day: Pick<ItineraryTableDay, "number">): string {
  return `Day ${day.number}`;
}

export const STOP_KIND_LABELS: Record<ItineraryTableStopKind, string> = {
  start: "Start",
  place: "Place",
  charger: "EV charging",
  end: "End",
};
