"use client";

import type { CSSProperties } from "react";
import { format, isValid, parseISO } from "date-fns";

import { Checkbox } from "@/components/ui/checkbox";

import { getTripBlockColorById } from "../../constants/trip-block-colors";
import type { TripBlockData } from "../../constants/types";

type ExportDayPickerProps = {
  days: TripBlockData[];
  selectedIds: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
};

const CHIP_CLASS =
  "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 text-sm text-foreground transition-colors hover:bg-muted has-data-checked:border-primary has-data-checked:bg-primary/8 has-focus-visible:ring-2 has-focus-visible:ring-ring/50";

function shortDate(date: string): string {
  const parsed = date ? parseISO(date) : null;
  return parsed && isValid(parsed) ? format(parsed, "MMM d") : "";
}

/** Chooses which days go into the export: all at once, or any mix of single days. */
export function ExportDayPicker({ days, selectedIds, onChange }: ExportDayPickerProps) {
  const selectedCount = days.filter((day) => selectedIds.has(day.id)).length;
  const allSelected = selectedCount === days.length && days.length > 0;

  function toggleDay(dayId: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) next.add(dayId);
    else next.delete(dayId);
    onChange(next);
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium text-foreground">Days to export</legend>
      {/* Phones keep the chips on one swipeable line so the preview keeps its height. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto p-1 *:shrink-0 sm:flex-wrap sm:overflow-visible">
        <label className={CHIP_CLASS}>
          <Checkbox
            checked={allSelected}
            indeterminate={selectedCount > 0 && !allSelected}
            onCheckedChange={(checked) => onChange(new Set(checked ? days.map((day) => day.id) : []))}
          />
          All days
        </label>
        {days.map((day, index) => {
          const dot: CSSProperties = { backgroundColor: getTripBlockColorById(day.colorId).value };
          const date = shortDate(day.date);
          return (
            <label key={day.id} className={CHIP_CLASS}>
              <Checkbox
                checked={selectedIds.has(day.id)}
                onCheckedChange={(checked) => toggleDay(day.id, checked)}
              />
              <span className="size-2.5 shrink-0 rounded-full" style={dot} aria-hidden="true" />
              <span>Day {index + 1}</span>
              {date && <span className="text-muted-foreground">{date}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
