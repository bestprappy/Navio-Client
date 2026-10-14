"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import type { PlaceItem, PlaceScheduleEntry } from "../../../constants/types";
import {
  createScheduleEntry,
  formatClock,
  formatDuration,
  freeMinutesBefore,
  isOutsideStop,
  MAX_SCHEDULE_ENTRIES,
  MAX_SCHEDULE_LABEL_LENGTH,
  sortSchedule,
  splitLeadingTime,
  suggestNextTime,
  timeAfter,
} from "../../../itinerary/stop-schedule";
import { updatePlaceItemAtom } from "../../../overview/trip-builder.atoms";
import { ScheduleRail } from "./schedule-rail";
import { ScheduleTimeInput } from "./schedule-time-input";
import styles from "./stop-schedule.module.css";

type StopScheduleEditorProps = {
  blockId: string;
  item: PlaceItem;
};

const EMPTY: readonly PlaceScheduleEntry[] = [];

function describeStopTime(item: Pick<PlaceItem, "time" | "timeEnd">): string {
  if (!item.time) return "";
  return item.timeEnd ? `${formatClock(item.time)} – ${formatClock(item.timeEnd)}` : `from ${formatClock(item.time)}`;
}

/**
 * The moments inside one stop, written like lines in a note: Enter starts the next moment,
 * Backspace on an empty one removes it, and a line typed as "7:30 Grab the bags" takes its time.
 */
export function StopScheduleEditor({ blockId, item }: StopScheduleEditorProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const entries = item.schedule ?? EMPTY;
  const labelRefs = useRef(new Map<string, HTMLInputElement>());
  const addRef = useRef<HTMLButtonElement>(null);
  // Where focus goes once the saved schedule has rendered: a moment's label, or the add button.
  const pendingFocusRef = useRef<string | null>(null);
  const [invalidIds, setInvalidIds] = useState<ReadonlySet<string>>(new Set());
  const errorId = useId();
  const stopTime = describeStopTime(item);
  const full = entries.length >= MAX_SCHEDULE_ENTRIES;

  const save = useCallback(
    (next: readonly PlaceScheduleEntry[]) => updatePlaceItem({ blockId, itemId: item.id, updates: { schedule: [...next] } }),
    [blockId, item.id, updatePlaceItem],
  );

  useEffect(() => {
    const target = pendingFocusRef.current;
    if (!target) return;
    pendingFocusRef.current = null;
    if (target === "add") addRef.current?.focus();
    else labelRefs.current.get(target)?.focus();
  }, [entries]);

  const outside = useMemo(
    () => new Set(entries.filter((entry) => isOutsideStop(entry, item)).map((entry) => entry.id)),
    [entries, item],
  );

  function updateEntry(id: string, changes: Partial<PlaceScheduleEntry>, resort = false) {
    const next = entries.map((entry) => {
      if (entry.id !== id) return entry;
      const merged = { ...entry, ...changes };
      if (!merged.timeEnd) delete merged.timeEnd;
      return merged;
    });
    save(resort ? sortSchedule(next) : next);
  }

  function addEntry(after?: PlaceScheduleEntry, base: readonly PlaceScheduleEntry[] = entries) {
    if (base.length >= MAX_SCHEDULE_ENTRIES) return;
    const entry = createScheduleEntry(after ? timeAfter(after) : suggestNextTime(item));
    save(sortSchedule([...base, entry]));
    pendingFocusRef.current = entry.id;
  }

  function removeEntry(id: string, focus: "previous" | "add") {
    const index = entries.findIndex((entry) => entry.id === id);
    const previous = index > 0 ? entries[index - 1] : undefined;
    save(entries.filter((entry) => entry.id !== id));
    setInvalid(id, false);
    pendingFocusRef.current = focus === "previous" && previous ? previous.id : "add";
  }

  /** "7:30 AM Grab the bags" becomes a 7:30 moment called "Grab the bags". */
  function withLeadingTime(entry: PlaceScheduleEntry): { entry: PlaceScheduleEntry; entries: readonly PlaceScheduleEntry[] } | null {
    const split = splitLeadingTime(entry.label);
    if (!split) return null;
    const next: PlaceScheduleEntry = { id: entry.id, time: split.time, label: split.label };
    if (split.timeEnd) next.timeEnd = split.timeEnd;
    return { entry: next, entries: sortSchedule(entries.map((candidate) => candidate.id === entry.id ? next : candidate)) };
  }

  function takeLeadingTime(entry: PlaceScheduleEntry) {
    const split = withLeadingTime(entry);
    if (split) save(split.entries);
  }

  function handleLabelKeyDown(event: KeyboardEvent<HTMLInputElement>, entry: PlaceScheduleEntry) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      const split = withLeadingTime(entry);
      addEntry(split?.entry ?? entry, split?.entries ?? entries);
    } else if (event.key === "Backspace" && entry.label === "" && event.currentTarget.selectionStart === 0) {
      event.preventDefault();
      removeEntry(entry.id, "previous");
    } else if (event.key === "Escape") {
      event.currentTarget.blur();
    }
  }

  function setInvalid(id: string, invalid: boolean) {
    setInvalidIds((current) => {
      if (current.has(id) === invalid) return current;
      const next = new Set(current);
      if (invalid) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    // The card selects its place on click; typing here should not re-trigger that.
    <section aria-label={`Schedule at ${item.name}`} className="min-w-0" onClick={(event) => event.stopPropagation()}>
      <ScheduleRail.Timeline label={`Schedule at ${item.name}`}>
        {entries.map((entry, index) => {
          const free = freeMinutesBefore(entries, index);
          const isOutside = outside.has(entry.id);
          return (
            <ScheduleRail.Item key={entry.id}>
              {free !== null ? <ScheduleRail.Gap>{formatDuration(free)} free</ScheduleRail.Gap> : null}
              <ScheduleRail.Row
                dot={isOutside ? "outside" : "moment"}
                time={
                  <>
                    <ScheduleTimeInput
                      value={entry.time}
                      label={`Start time for ${entry.label || "this moment"}`}
                      variant="start"
                      errorId={errorId}
                      onInvalidChange={(invalid) => setInvalid(`${entry.id}:start`, invalid)}
                      onCommit={(time) => time && updateEntry(entry.id, { time }, true)}
                    />
                    <ScheduleTimeInput
                      value={entry.timeEnd}
                      label={`End time for ${entry.label || "this moment"} (optional)`}
                      placeholder="until…"
                      optional
                      variant="end"
                      errorId={errorId}
                      onInvalidChange={(invalid) => setInvalid(`${entry.id}:end`, invalid)}
                      onCommit={(timeEnd) => updateEntry(entry.id, { timeEnd })}
                    />
                  </>
                }
                trailing={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className={styles.remove}
                    aria-label={`Remove ${entry.label || "this moment"}`}
                    onClick={() => removeEntry(entry.id, "add")}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                }
              >
                <div className="flex min-w-0 items-start gap-1.5">
                  <input
                    ref={(node) => {
                      if (node) labelRefs.current.set(entry.id, node);
                      else labelRefs.current.delete(entry.id);
                    }}
                    type="text"
                    value={entry.label}
                    maxLength={MAX_SCHEDULE_LABEL_LENGTH}
                    placeholder="What happens"
                    aria-label={`What happens at ${formatClock(entry.time)}`}
                    className={styles.field}
                    onChange={(event) => updateEntry(entry.id, { label: event.target.value })}
                    onBlur={() => takeLeadingTime(entry)}
                    onKeyDown={(event) => handleLabelKeyDown(event, entry)}
                  />
                  {isOutside ? (
                    <span
                      className="mt-1.5 inline-flex shrink-0 text-warning"
                      title={`Outside this stop's time (${stopTime})`}
                    >
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Outside this stop&apos;s time, {stopTime}</span>
                    </span>
                  ) : null}
                </div>
              </ScheduleRail.Row>
            </ScheduleRail.Item>
          );
        })}
        <ScheduleRail.Item>
          <ScheduleRail.Row dot="add">
            <button
              ref={addRef}
              type="button"
              className={styles.addButton}
              disabled={full}
              title={full ? `A stop can hold up to ${MAX_SCHEDULE_ENTRIES} times` : undefined}
              onClick={() => addEntry()}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {entries.length ? "Add a time" : "Plan times inside this stop"}
            </button>
          </ScheduleRail.Row>
        </ScheduleRail.Item>
      </ScheduleRail.Timeline>
      {invalidIds.size ? (
        <p id={errorId} role="alert" className="mt-1 pl-1 text-xs text-destructive">
          Use a time like 9:30, 930 or 2 pm.
        </p>
      ) : null}
    </section>
  );
}
