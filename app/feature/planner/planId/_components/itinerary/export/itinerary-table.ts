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

/** One moment inside a stop's visit, such as "9:00 AM – 9:10 AM Check in". */
export type ItineraryTableMoment = {
  id: string;
  time: string;
  label: string;
};

export type ItineraryTableRow = {
  id: string;
  kind: ItineraryTableStopKind;
  /** The number the stop's map pin shows; charging stops are not numbered. */
  position: number | null;
  /** "9:00 AM – 10:30 AM", "9:00 AM", or null when the stop has no time. */
  time: string | null;
  /** True when Calculate times filled the time rather than the traveller. */
  timeIsCalculated: boolean;
  /** Minutes after midnight, for working out stays and late arrivals; null without a time. */
  startMinute: number | null;
  endMinute: number | null;
  name: string;
  /** The place's type as the planner labels it, such as "Shopping mall". */
  category: string | null;
  /** Provider machine type, which picks the category's colour. */
  placeType: string | null;
  /** Where the stop is, when known; shared plans' day starts and ends carry only a name. */
  coordinates: { lat: number; lng: number } | null;
  address: string;
  /** EV charging plan, e.g. "About 45 min, charge to 80%". */
  chargeDetail: string | null;
  notes: string;
  /** The traveller's timetable inside the stop, in time order. */
  moments: ItineraryTableMoment[];
  imageUrl: string | null;
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
  /** A name the traveller gave the day, or "" when it only carries its date. */
  title: string;
  /** From the first timed stop's start to the last one's end, e.g. "9:00 AM – 6:30 PM". */
  timeSpan: string | null;
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

/** Joins a stop's start and end in a formatted time range. */
export const TIME_RANGE_SEPARATOR = " – ";

/** Minutes after midnight for "HH:mm", or null when the value is not a time. */
export function toClockMinute(time: string | undefined): number | null {
  const match = time?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

function formatTimeRange(time: string | undefined, timeEnd: string | undefined): string | null {
  if (!time) return null;
  return timeEnd ? `${formatTableTime(time)}${TIME_RANGE_SEPARATOR}${formatTableTime(timeEnd)}` : formatTableTime(time);
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

function toMoments(item: PlaceItem): ItineraryTableMoment[] {
  return (item.schedule ?? [])
    .filter((entry) => entry.time || entry.label.trim())
    .toSorted((a, b) => a.time.localeCompare(b.time))
    .map((entry) => ({
      id: entry.id,
      time: formatTimeRange(entry.time, entry.timeEnd) ?? "",
      label: entry.label.trim(),
    }));
}

function toPlaceRow(
  item: PlaceItem,
  position: number | null,
  expenses: ExpenseItem[],
  currency: CurrencyCode,
): ItineraryTableRow {
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
    position,
    time: formatTimeRange(item.time, item.timeEnd),
    timeIsCalculated: Boolean(item.time) && item.timeSource === "calculated",
    startMinute: toClockMinute(item.time),
    endMinute: toClockMinute(item.timeEnd),
    name: item.name.trim() || (isCharger ? "Charging stop" : "Planned stop"),
    category: isCharger ? null : item.description?.trim() || null,
    placeType: item.placeType ?? null,
    coordinates: Number.isFinite(item.lat) && Number.isFinite(item.lng) ? { lat: item.lat, lng: item.lng } : null,
    address: item.address?.trim() ?? "",
    chargeDetail: isCharger ? formatChargeDetail(item) : null,
    notes: item.notes?.trim() ?? "",
    moments: toMoments(item),
    imageUrl: item.imageUrl?.trim() || null,
    expenses: rowExpenses,
    total,
  };
}

function toAnchorRow(
  dayId: string,
  kind: "start" | "end",
  anchor: ItineraryTableAnchor,
  position: number,
): ItineraryTableRow {
  return {
    // Matches the route point ID, so the leg arriving here can be found.
    id: `${dayId}:${kind}`,
    kind,
    position,
    time: null,
    timeIsCalculated: false,
    startMinute: null,
    endMinute: null,
    name: anchor.name,
    category: null,
    placeType: null,
    coordinates: null,
    address: anchor.address?.trim() ?? "",
    chargeDetail: null,
    notes: "",
    moments: [],
    imageUrl: null,
    expenses: [],
    total: null,
  };
}

function getTimeSpan(items: PlaceItem[]): string | null {
  const timed = items.filter((item) => item.time);
  const first = timed[0]?.time;
  const lastItem = timed[timed.length - 1];
  const last = lastItem?.timeEnd ?? lastItem?.time;
  if (!first || !last) return null;
  return first === last ? formatTableTime(first) : `${formatTableTime(first)}${TIME_RANGE_SEPARATOR}${formatTableTime(last)}`;
}

/** Numbers the stops the way the map pins do: start first, places in order, end last. */
function toDayRows(
  block: TripBlockData,
  dayAnchors: ItineraryTableAnchors | undefined,
  expenses: ExpenseItem[],
  currency: CurrencyCode,
): ItineraryTableRow[] {
  let position = 0;
  const rows: ItineraryTableRow[] = [];
  if (dayAnchors?.start) rows.push(toAnchorRow(block.id, "start", dayAnchors.start, ++position));
  for (const item of block.items.filter(isPlaceItem)) {
    rows.push(toPlaceRow(item, isEvChargerPlaceItem(item) ? null : ++position, expenses, currency));
  }
  if (dayAnchors?.end) rows.push(toAnchorRow(block.id, "end", dayAnchors.end, ++position));
  return rows;
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
      const rows = toDayRows(block, anchors.get(block.id), expenses, currency);
      const total = roundMoney(rows.reduce((sum, row) => sum + (row.total ?? 0), 0), currency);
      // Unnamed days carry their date as the title.
      const title = block.title.trim() && block.title !== block.date ? block.title.trim() : "";
      const timeSpan = getTimeSpan(block.items.filter(isPlaceItem));
      return [{ id: block.id, number: index + 1, date: block.date, title, timeSpan, colorId: block.colorId, rows, total }];
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
