import { formatMoney } from "../../budget/budget.utils";
import type { TripBlockColorId } from "../../constants/types";
import {
  STOP_KIND_LABELS,
  formatTableDate,
  getTableDayLabel,
  type ItineraryTable,
  type ItineraryTableExpense,
} from "./itinerary-table";

export type SheetCell = string | number | null;

export type SheetRow =
  | { kind: "header"; cells: SheetCell[] }
  | { kind: "stop"; colorId: TripBlockColorId; cells: SheetCell[] }
  | { kind: "day-total"; colorId: TripBlockColorId; cells: SheetCell[] }
  | { kind: "trip-total"; cells: SheetCell[] };

export type SheetColumn = { title: string; width: number };

/** Spreadsheet columns. The amount sits in its own numeric column so totals can be summed. */
export function getSheetColumns(table: Pick<ItineraryTable, "currency">): SheetColumn[] {
  return [
    { title: "Day", width: 8 },
    { title: "Date", width: 14 },
    { title: "Time", width: 20 },
    { title: "Stop", width: 12 },
    { title: "Place", width: 32 },
    { title: "Address", width: 40 },
    { title: "Notes", width: 40 },
    { title: "Expenses", width: 36 },
    { title: `Cost (${table.currency})`, width: 14 },
  ];
}

function describeExpense(expense: ItineraryTableExpense, table: ItineraryTable): string {
  const amount = formatMoney(expense.amount, table.currency);
  return expense.label === expense.categoryLabel
    ? `${expense.categoryLabel}: ${amount}`
    : `${expense.categoryLabel}: ${expense.label} ${amount}`;
}

export function toSheetRows(table: ItineraryTable): SheetRow[] {
  const columns = getSheetColumns(table);
  const blank = (): SheetCell[] => columns.map(() => null);
  const rows: SheetRow[] = [{ kind: "header", cells: columns.map((column) => column.title) }];

  for (const day of table.days) {
    const dayLabel = getTableDayLabel(day);
    const date = formatTableDate(day.date);
    for (const row of day.rows) {
      rows.push({
        kind: "stop",
        colorId: day.colorId,
        cells: [
          dayLabel,
          date,
          row.time ?? "",
          STOP_KIND_LABELS[row.kind],
          row.name,
          row.address,
          [row.chargeDetail, row.notes].filter(Boolean).join("\n"),
          row.expenses.map((expense) => describeExpense(expense, table)).join("\n"),
          row.total,
        ],
      });
    }
    const totalCells = blank();
    totalCells[0] = dayLabel;
    totalCells[1] = date;
    totalCells[columns.length - 2] = `${dayLabel} total`;
    totalCells[columns.length - 1] = day.total;
    rows.push({ kind: "day-total", colorId: day.colorId, cells: totalCells });
  }

  const tripCells = blank();
  tripCells[columns.length - 2] = "Trip total";
  tripCells[columns.length - 1] = table.total;
  rows.push({ kind: "trip-total", cells: tripCells });
  return rows;
}
