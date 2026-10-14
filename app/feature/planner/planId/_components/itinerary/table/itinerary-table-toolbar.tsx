"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Sheet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { formatTableDate, getTableDayLabel, type ItineraryTableDay } from "../export/itinerary-table";
import styles from "./itinerary-table-view.module.css";

export type ItineraryExportFormat = "pdf" | "xlsx" | "csv";

type DayOption = Pick<ItineraryTableDay, "id" | "number" | "date" | "title">;

type ItineraryTableToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  days: DayOption[];
  /** Days shown; null shows every day. */
  shownDayIds: ReadonlySet<string> | null;
  onShownDayIdsChange: (ids: ReadonlySet<string> | null) => void;
  onExport: (format: ItineraryExportFormat) => void;
  allOpen: boolean;
  onToggleAll: () => void;
};

function DayFilter({ days, shownDayIds, onShownDayIdsChange }: Pick<ItineraryTableToolbarProps, "days" | "shownDayIds" | "onShownDayIdsChange">) {
  const shownCount = shownDayIds ? days.filter((day) => shownDayIds.has(day.id)).length : days.length;
  const label = shownDayIds === null ? "All days" : `${shownCount} of ${days.length} days`;

  function toggle(dayId: string, checked: boolean) {
    const next = new Set(shownDayIds ?? days.map((day) => day.id));
    if (checked) next.add(dayId);
    else next.delete(dayId);
    onShownDayIdsChange(next.size === days.length ? null : next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="h-10 gap-2" aria-label={`Days shown: ${label}`} />}>
        <CalendarDays aria-hidden="true" />
        {label}
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Show days</DropdownMenuLabel>
          {days.map((day) => (
            <DropdownMenuCheckboxItem
              key={day.id}
              checked={shownDayIds === null || shownDayIds.has(day.id)}
              onCheckedChange={(checked) => toggle(day.id, checked)}
              closeOnClick={false}
              className="min-h-9"
            >
              <span className="font-medium">{getTableDayLabel(day)}</span>
              <span className="truncate text-muted-foreground">{day.title || formatTableDate(day.date)}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={shownDayIds === null} onClick={() => onShownDayIdsChange(null)} className="min-h-9">
          Show all days
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExportMenu({ dayCount, onExport }: { dayCount: number; onExport: ItineraryTableToolbarProps["onExport"] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="h-10 gap-2 px-4" disabled={dayCount === 0} />}>
        <Download aria-hidden="true" />
        Export
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Exports the {dayCount === 1 ? "day" : `${dayCount} days`} shown</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onExport("pdf")} className="min-h-12 items-start py-2">
            <FileText className="mt-0.5" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="font-medium">PDF handout</span>
              <span className="text-xs text-muted-foreground">A printable day-by-day plan for travellers</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport("xlsx")} className="min-h-9">
            <FileSpreadsheet aria-hidden="true" />
            Excel workbook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport("csv")} className="min-h-9">
            <Sheet aria-hidden="true" />
            CSV file
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Export, search and day filter for the itinerary table. */
export function ItineraryTableToolbar({
  search,
  onSearchChange,
  days,
  shownDayIds,
  onShownDayIdsChange,
  onExport,
  allOpen,
  onToggleAll,
}: ItineraryTableToolbarProps) {
  const shownCount = shownDayIds ? days.filter((day) => shownDayIds.has(day.id)).length : days.length;
  return (
    <div className={styles.toolbar}>
      <ExportMenu dayCount={shownCount} onExport={onExport} />
      <div className="relative w-full min-w-0 sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && search) {
              event.preventDefault();
              onSearchChange("");
            }
          }}
          placeholder="Search stops and notes"
          aria-label="Search stops and notes"
          className="h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <DayFilter days={days} shownDayIds={shownDayIds} onShownDayIdsChange={onShownDayIdsChange} />
      <Button variant="ghost" className={`${styles.toolbarEnd} h-10 gap-2 text-primary`} aria-expanded={allOpen} onClick={onToggleAll}>
        {allOpen ? <ChevronsDownUp aria-hidden="true" /> : <ChevronsUpDown aria-hidden="true" />}
        {allOpen ? "Collapse all days" : "Expand all days"}
      </Button>
    </div>
  );
}
