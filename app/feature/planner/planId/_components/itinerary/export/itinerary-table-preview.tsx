"use client";

import type { CSSProperties } from "react";
import { Flag, MapPin, Zap } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { getExpenseCategory } from "../../budget/budget.data";
import { formatMoney } from "../../budget/budget.utils";
import { getTripBlockColorById } from "../../constants/trip-block-colors";
import {
  formatTableDate,
  getTableDayLabel,
  type ItineraryTable,
  type ItineraryTableDay,
  type ItineraryTableRow,
} from "./itinerary-table";

type DayStyle = CSSProperties & { "--day": string };

const ANCHOR_LABEL = { start: "Day starts", end: "Day ends" } as const;

function DayCell({ day, rowSpan }: { day: ItineraryTableDay; rowSpan: number }) {
  const style: DayStyle = { "--day": getTripBlockColorById(day.colorId).value };
  const date = formatTableDate(day.date);
  return (
    <TableHead
      scope="rowgroup"
      rowSpan={rowSpan}
      style={style}
      className="h-auto w-28 border-l-4 border-l-(--day) bg-[color-mix(in_oklch,var(--day)_10%,var(--card))] px-3 py-3 align-top"
    >
      <span className="inline-flex rounded-md bg-(--day) px-2 py-0.5 text-xs font-semibold text-(--planner-block-foreground)">
        {getTableDayLabel(day)}
      </span>
      {date && <span className="mt-1.5 block text-sm font-medium text-foreground">{date}</span>}
    </TableHead>
  );
}

function PlaceCell({ row }: { row: ItineraryTableRow }) {
  if (row.kind === "start" || row.kind === "end") {
    const Icon = row.kind === "start" ? MapPin : Flag;
    return (
      <>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon className="size-3 shrink-0" aria-hidden="true" />
          {ANCHOR_LABEL[row.kind]}
        </span>
        <span className="block font-medium text-foreground">{row.name}</span>
      </>
    );
  }
  return (
    <>
      {row.kind === "charger" && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="size-3 shrink-0" aria-hidden="true" />
          EV charging
        </span>
      )}
      <span className="block font-medium text-foreground">{row.name}</span>
      {row.chargeDetail && <span className="block text-xs text-muted-foreground">{row.chargeDetail}</span>}
      {row.address && <span className="block text-xs text-muted-foreground">{row.address}</span>}
    </>
  );
}

function ExpensesCell({ row, currency }: { row: ItineraryTableRow; currency: ItineraryTable["currency"] }) {
  if (row.expenses.length) {
    return (
      <ul className="space-y-1">
        {row.expenses.map((expense, index) => {
          const Icon = getExpenseCategory(expense.categoryId).Icon;
          return (
            <li key={`${expense.label}-${index}`} className="flex items-start gap-2">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-label={expense.categoryLabel} />
              <span className="min-w-0 flex-1 text-foreground">{expense.label}</span>
              <span className="shrink-0 tabular-nums text-foreground">{formatMoney(expense.amount, currency)}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  if (row.total !== null) {
    return <span className="block text-right tabular-nums text-foreground">{formatMoney(row.total, currency)}</span>;
  }
  return null;
}

function DayRows({ day, currency }: { day: ItineraryTableDay; currency: ItineraryTable["currency"] }) {
  const rowSpan = Math.max(day.rows.length, 1) + 1;
  const dayLabel = getTableDayLabel(day);
  return (
    <>
      {day.rows.length === 0 ? (
        <TableRow className="hover:bg-transparent">
          <DayCell day={day} rowSpan={rowSpan} />
          <TableCell colSpan={4} className="py-3 text-muted-foreground">No places on this day.</TableCell>
        </TableRow>
      ) : day.rows.map((row, index) => (
        <TableRow key={row.id} className="hover:bg-transparent">
          {index === 0 && <DayCell day={day} rowSpan={rowSpan} />}
          <TableCell className={cn("py-3 align-top tabular-nums", row.time ? "text-foreground" : "text-muted-foreground")}>
            {row.time ?? <span aria-label="No time">–</span>}
          </TableCell>
          <TableCell className="min-w-48 max-w-72 py-3 align-top whitespace-normal">
            <PlaceCell row={row} />
          </TableCell>
          <TableCell className="min-w-44 max-w-72 py-3 align-top whitespace-pre-line text-muted-foreground">
            {row.notes}
          </TableCell>
          <TableCell className="min-w-52 py-3 align-top whitespace-normal">
            <ExpensesCell row={row} currency={currency} />
          </TableCell>
        </TableRow>
      ))}
      <TableRow className="border-b-2 hover:bg-transparent">
        <TableCell colSpan={3} className="py-2 text-right text-xs font-medium text-muted-foreground">
          {dayLabel} total
        </TableCell>
        <TableCell className="py-2 text-right font-semibold tabular-nums text-foreground">
          {formatMoney(day.total, currency)}
        </TableCell>
      </TableRow>
    </>
  );
}

/** The exported table as it will read, one colored band per day. */
export function ItineraryTablePreview({ table, className }: { table: ItineraryTable; className?: string }) {
  return (
    // The outer box scrolls both ways so the sticky header holds; the table's own wrapper must not scroll too.
    <div className={cn("overflow-auto rounded-lg border bg-card *:data-[slot=table-container]:overflow-visible", className)}>
      <Table className="min-w-[46rem]" aria-label="Itinerary table preview">
        <TableHeader className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_var(--border)]">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="px-3 text-xs text-muted-foreground">Day</TableHead>
            <TableHead scope="col" className="text-xs text-muted-foreground">Time</TableHead>
            <TableHead scope="col" className="text-xs text-muted-foreground">Place</TableHead>
            <TableHead scope="col" className="text-xs text-muted-foreground">Notes</TableHead>
            <TableHead scope="col" className="text-right text-xs text-muted-foreground">Expenses</TableHead>
          </TableRow>
        </TableHeader>
        {table.days.map((day) => (
          <TableBody key={day.id}>
            <DayRows day={day} currency={table.currency} />
          </TableBody>
        ))}
        <TableFooter className="bg-muted">
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={4} className="px-3 py-3 text-right font-semibold text-foreground">Trip total</TableCell>
            <TableCell className="py-3 text-right font-semibold tabular-nums text-foreground">
              {formatMoney(table.total, table.currency)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
