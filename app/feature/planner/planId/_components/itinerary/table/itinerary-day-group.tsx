"use client";

import { memo, useMemo, type CSSProperties, type MouseEvent } from "react";
import { ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { getTripBlockColorById } from "../../constants/trip-block-colors";
import {
  formatTableDate,
  getTableDayLabel,
  type ItineraryTable,
  type ItineraryTableDay,
  type ItineraryTableRow,
} from "../export/itinerary-table";
import {
  CostCell,
  NotesCell,
  PositionCell,
  StopCell,
  SummaryCost,
  SummaryLabel,
  SummarySpan,
  TimeCell,
  TravelCell,
  TravelSummary,
  TypeCell,
  type RouteState,
} from "./itinerary-table-cells";
import { getLateArrivals } from "./itinerary-table-legs";
import styles from "./itinerary-table-view.module.css";

export type { RouteState } from "./itinerary-table-cells";

type DayStyle = CSSProperties & { "--day": string };

type ItineraryDayGroupProps = {
  day: ItineraryTableDay;
  currency: ItineraryTable["currency"];
  routes: RouteState;
  /** Plain-text notes by row ID. */
  notes: ReadonlyMap<string, string>;
  isOpen: boolean;
  readOnly: boolean;
  /** True when a search hides some of the day's stops. */
  isFiltered: boolean;
  /** The day's first stop, which no leg arrives at, even when a search hides it. */
  firstRowId: string | undefined;
  /** Every row of the day, so late arrivals are worked out even while a search hides some. */
  allRows: readonly ItineraryTableRow[];
  onToggle: (dayId: string) => void;
  onShowInPlan: (dayId: string, row?: ItineraryTableRow) => void;
};

function pluralize(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

function ColumnWidths() {
  return (
    <colgroup>
      <col className={styles.colPosition} />
      <col className={styles.colStop} />
      <col className={styles.colType} />
      <col className={styles.colTime} />
      <col className={styles.colTravel} />
      <col />
      <col className={styles.colCost} />
    </colgroup>
  );
}

/** One day of the itinerary table: a collapsible group with its stops and a summary row. */
export const ItineraryDayGroup = memo(function ItineraryDayGroup({
  day,
  currency,
  routes,
  notes,
  isOpen,
  readOnly,
  isFiltered,
  firstRowId,
  allRows,
  onToggle,
  onShowInPlan,
}: ItineraryDayGroupProps) {
  const style: DayStyle = { "--day": getTripBlockColorById(day.colorId).value };
  const date = formatTableDate(day.date);
  const label = getTableDayLabel(day);
  const headingId = `table-day-${day.id}`;
  const contentId = `table-day-content-${day.id}`;
  const stopCount = day.rows.filter((row) => row.kind === "place" || row.kind === "charger").length;
  const lateArrivals = useMemo(() => getLateArrivals(allRows, routes.legs), [allRows, routes.legs]);
  const isEmpty = day.rows.length === 0;

  return (
    <section className={styles.group} style={style} aria-labelledby={headingId}>
      <div className={styles.groupHead}>
        <h3 id={headingId} className={styles.groupTitle}>
          <button
            type="button"
            className={styles.groupToggle}
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={() => onToggle(day.id)}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
            <span>{day.title ? `${label}: ${day.title}` : label}</span>
          </button>
        </h3>
        {date && <span className="text-sm font-medium text-foreground">{date}</span>}
        <span className="text-sm text-muted-foreground">
          {isFiltered
            ? `${day.rows.length} ${day.rows.length === 1 ? "match" : "matches"}`
            : stopCount ? pluralize(stopCount, "stop") : "No stops"}
        </span>
      </div>

      {isOpen && isEmpty && (
        // An empty day needs no columns, only a way to fill it.
        <div id={contentId} className={styles.emptyDay}>
          <span>Nothing planned for this day yet.</span>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={() => onShowInPlan(day.id)}>
              <Plus aria-hidden="true" />
              Add stops in the plan
            </Button>
          )}
        </div>
      )}

      {isOpen && !isEmpty && (
        <div id={contentId} className={styles.frame}>
          <table className={styles.table} aria-labelledby={headingId}>
            <ColumnWidths />
            <thead>
              <tr>
                <th scope="col" className={styles.positionCol}><span className="sr-only">Stop number</span><span aria-hidden="true">#</span></th>
                <th scope="col" className={styles.stopCol}>Stop</th>
                <th scope="col">Type</th>
                <th scope="col">Time</th>
                <th scope="col">Getting here</th>
                <th scope="col">Notes</th>
                <th scope="col" className={styles.cost}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {day.rows.map((row) => {
                const show = (event: MouseEvent) => {
                  event.stopPropagation();
                  onShowInPlan(day.id, row);
                };
                return (
                  // The stop name is the keyboard target; the whole row is a larger mouse target.
                  <tr key={row.id} className={styles.row} onClick={show}>
                    <td className={styles.positionCol}><PositionCell row={row} /></td>
                    <td className={styles.stopCol}><StopCell row={row} onShow={show} /></td>
                    <td><TypeCell row={row} /></td>
                    <td><TimeCell row={row} lateMinutes={lateArrivals.get(row.id)} /></td>
                    <td><TravelCell leg={routes.legs.get(row.id)} isFirst={row.id === firstRowId} routes={routes} /></td>
                    <td><NotesCell text={notes.get(row.id) ?? ""} /></td>
                    <td className={styles.cost}>
                      <CostCell row={row} currency={currency} onShow={() => onShowInPlan(day.id, row)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals describe the whole day, so they are hidden while a search narrows it. */}
            {!isFiltered && (
              <tfoot>
                <tr className={styles.summary}>
                  <td className={styles.positionCol} />
                  <td className={styles.stopCol}><SummaryLabel label={label} /></td>
                  <td />
                  <td><SummarySpan timeSpan={day.timeSpan} /></td>
                  <td colSpan={2}><TravelSummary day={day} routes={routes} /></td>
                  <td className={styles.cost}><SummaryCost total={day.total} currency={currency} /></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  );
});
