"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { CalendarPlus, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getNotePlainText } from "@/components/block-editor/note-plain-text";

import { formatMoney, roundMoney } from "../../budget/budget.utils";
import { plannerMobileViewAtom } from "../../layout/planner-workspace";
import {
  itineraryBlocksAtom,
  plannerReadOnlyAtom,
  tripCurrencyAtom,
  tripExpensesAtom,
} from "../../overview/trip-builder.atoms";
import { formatRouteDuration } from "../../routes/trip-route.helpers";
import { useTripRoutes } from "../../routes/trip-route-query";
import { downloadItinerarySpreadsheet } from "../export/itinerary-download";
import {
  buildItineraryTable,
  formatTableDate,
  type ItineraryTable,
  type ItineraryTableAnchors,
  type ItineraryTableRow,
} from "../export/itinerary-table";
import { ItineraryHandoutDialog } from "../handout/itinerary-handout-dialog";
import { useRevealPlanCard } from "../use-reveal-plan-card";
import { ItineraryDayGroup, type RouteState } from "./itinerary-day-group";
import { getArrivalLegs, summarizeDayTravel } from "./itinerary-table-legs";
import { ItineraryTableToolbar, type ItineraryExportFormat } from "./itinerary-table-toolbar";
import styles from "./itinerary-table-view.module.css";
import { ItineraryViewSwitch } from "./itinerary-view-switch";
import { useItineraryTableAnchors } from "./use-itinerary-table-anchors";
import { useItineraryView } from "./use-itinerary-view";

export type ItineraryTableViewProps = {
  /** The trip's name, shown as the page title and on the handout. */
  title: string;
  /** Names exported files, such as the destination. */
  destinationName: string;
  /** Day starts and ends when the blocks do not carry them, as on shared plans. */
  anchors?: ReadonlyMap<string, ItineraryTableAnchors>;
};

function pluralize(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

function countStops(table: ItineraryTable) {
  return table.days.reduce((count, day) => count + day.rows.filter((row) => row.kind === "place" || row.kind === "charger").length, 0);
}

function rowMatches(row: ItineraryTableRow, notes: string, query: string) {
  return [row.name, row.address, row.chargeDetail ?? "", notes, ...row.moments.map((moment) => moment.label)]
    .some((text) => text.toLowerCase().includes(query));
}

/** The itinerary as one full-width table: every day a group, every stop a row. */
export function ItineraryTableView({ title, destinationName, anchors: anchorOverride }: ItineraryTableViewProps) {
  const blocks = useAtomValue(itineraryBlocksAtom);
  const expenses = useAtomValue(tripExpensesAtom);
  const currency = useAtomValue(tripCurrencyAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const anchors = useItineraryTableAnchors(anchorOverride);
  const routesQuery = useTripRoutes();
  const [, setView] = useItineraryView();
  const reveal = useRevealPlanCard();
  const setMobileView = useSetAtom(plannerMobileViewAtom);

  const [search, setSearch] = useState("");
  const query = useDeferredValue(search).trim().toLowerCase();
  const [shownDayIds, setShownDayIds] = useState<ReadonlySet<string> | null>(null);
  const [closedDayIds, setClosedDayIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isHandoutOpen, setIsHandoutOpen] = useState(false);
  const [failedExport, setFailedExport] = useState<"csv" | "xlsx" | null>(null);

  const fullTable = useMemo(
    () => buildItineraryTable({ blocks, expenses, currency: currency.code, anchors }),
    [blocks, expenses, currency.code, anchors],
  );
  // Exports and totals follow the day filter; the search only narrows what is on screen.
  const table = useMemo<ItineraryTable>(() => {
    if (!shownDayIds) return fullTable;
    const days = fullTable.days.filter((day) => shownDayIds.has(day.id));
    return { ...fullTable, days, total: roundMoney(days.reduce((sum, day) => sum + day.total, 0), fullTable.currency) };
  }, [fullTable, shownDayIds]);
  const notes = useMemo(
    () => new Map(fullTable.days.flatMap((day) => day.rows.map((row) => [row.id, getNotePlainText(row.notes)] as const))),
    [fullTable],
  );
  const visibleDays = useMemo(() => {
    if (!query) return table.days;
    return table.days
      .map((day) => ({ ...day, rows: day.rows.filter((row) => rowMatches(row, notes.get(row.id) ?? "", query)) }))
      .filter((day) => day.rows.length > 0);
  }, [table.days, notes, query]);
  const rowsByDay = useMemo(() => new Map(table.days.map((day) => [day.id, day.rows])), [table.days]);

  const legs = useMemo(() => getArrivalLegs(routesQuery.data?.segments ?? []), [routesQuery.data]);
  const routes = useMemo<RouteState>(
    () => ({ legs, isLoading: routesQuery.isLoading, isError: routesQuery.isError }),
    [legs, routesQuery.isLoading, routesQuery.isError],
  );
  const travelSeconds = useMemo(
    () => table.days.reduce((sum, day) => sum + summarizeDayTravel(day.rows.map((row) => legs.get(row.id))).totalSeconds, 0),
    [table.days, legs],
  );

  const showInPlan = useCallback((dayId: string, row?: ItineraryTableRow) => {
    setView("plan");
    setMobileView("itinerary");
    reveal(dayId, row && (row.kind === "place" || row.kind === "charger") ? row.id : undefined);
  }, [reveal, setMobileView, setView]);

  const toggleDay = useCallback((dayId: string) => {
    setClosedDayIds((ids) => {
      const next = new Set(ids);
      if (!next.delete(dayId)) next.add(dayId);
      return next;
    });
  }, []);
  const allOpen = visibleDays.every((day) => !closedDayIds.has(day.id));
  function toggleAll() {
    setClosedDayIds(allOpen ? new Set(visibleDays.map((day) => day.id)) : new Set());
  }

  function exportTable(format: ItineraryExportFormat) {
    if (format === "pdf") {
      setIsHandoutOpen(true);
      return;
    }
    try {
      downloadItinerarySpreadsheet(table, format, destinationName);
      setFailedExport(null);
    } catch (error) {
      console.error("Itinerary export failed.", {
        component: "ItineraryTableView",
        operation: "downloadItinerarySpreadsheet",
        format,
        dayCount: table.days.length,
        error,
      });
      setFailedExport(format);
    }
  }

  const firstDate = formatTableDate(fullTable.days[0]?.date ?? "");
  const lastDate = formatTableDate(fullTable.days.at(-1)?.date ?? "");
  const dateRange = firstDate && lastDate && firstDate !== lastDate ? `${firstDate} – ${lastDate}` : firstDate;
  const stopCount = countStops(table);

  return (
    <div className={styles.view} role="region" aria-label="Itinerary table">
      <header className={styles.header}>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate text-2xl leading-tight font-bold tracking-tight text-foreground">{title}</h2>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {dateRange && <span>{dateRange}</span>}
            <span>{pluralize(fullTable.days.length, "day")}</span>
            <span>{pluralize(countStops(fullTable), "stop")}</span>
          </p>
        </div>
        <ItineraryViewSwitch />
      </header>

      <ItineraryTableToolbar
        search={search}
        onSearchChange={setSearch}
        days={fullTable.days}
        shownDayIds={shownDayIds}
        onShownDayIdsChange={setShownDayIds}
        onExport={exportTable}
        allOpen={allOpen}
        onToggleAll={toggleAll}
      />
      {failedExport && (
        <p role="alert" className="px-6 pb-2 text-sm text-destructive">
          The {failedExport === "csv" ? "CSV file" : "Excel workbook"} could not be created. Try the export again.
        </p>
      )}

      <div className={styles.scroller}>
        {fullTable.days.length === 0 ? (
          <div className={styles.message}>
            <p className="font-semibold text-foreground">This trip has no days yet.</p>
            <p className="text-sm text-muted-foreground">Days and their stops appear here once they are in the plan.</p>
            {!readOnly && (
              <Button variant="outline" onClick={() => setView("plan")}>
                <CalendarPlus aria-hidden="true" />
                Add days in the plan
              </Button>
            )}
          </div>
        ) : table.days.length === 0 ? (
          <div className={styles.message}>
            <p className="font-semibold text-foreground">No days are selected.</p>
            <Button variant="outline" onClick={() => setShownDayIds(null)}>Show all days</Button>
          </div>
        ) : visibleDays.length === 0 ? (
          <div className={styles.message} role="status">
            <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="font-semibold text-foreground">No stops match &ldquo;{search.trim()}&rdquo;.</p>
            <Button variant="outline" onClick={() => setSearch("")}>Clear search</Button>
          </div>
        ) : (
          <>
            {visibleDays.map((day) => (
              <ItineraryDayGroup
                key={day.id}
                day={day}
                currency={table.currency}
                routes={routes}
                notes={notes}
                isOpen={!closedDayIds.has(day.id)}
                readOnly={readOnly}
                isFiltered={Boolean(query)}
                firstRowId={rowsByDay.get(day.id)?.[0]?.id}
                allRows={rowsByDay.get(day.id) ?? day.rows}
                onToggle={toggleDay}
                onShowInPlan={showInPlan}
              />
            ))}
            {!query && (
              <dl className={styles.tripTotal} aria-label={shownDayIds ? "Total for the days shown" : "Trip total"}>
                <div><dt>Days</dt><dd>{table.days.length}</dd></div>
                <div><dt>Stops</dt><dd>{stopCount}</dd></div>
                {travelSeconds > 0 && <div><dt>Travel</dt><dd>{formatRouteDuration(travelSeconds)}</dd></div>}
                <div><dt>{shownDayIds ? "Cost of days shown" : "Trip cost"}</dt><dd>{formatMoney(table.total, table.currency)}</dd></div>
              </dl>
            )}
          </>
        )}
      </div>

      <ItineraryHandoutDialog
        open={isHandoutOpen}
        onOpenChange={setIsHandoutOpen}
        table={table}
        legs={legs}
        title={title}
        destinationName={destinationName}
      />
    </div>
  );
}
