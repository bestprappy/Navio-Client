"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { updatePlaceItemAtom } from "../../overview/trip-builder.atoms";

type PlaceTimePopoverProps = {
  blockId: string;
  itemId: string;
  time?: string;
  timeEnd?: string;
};

type ActiveField = "start" | "end";

function formatDisplayTime(time: string): string {
  const [hourStr, minuteStr = "00"] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function parseTimeInput(value: string): string | null {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(value.trim());
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "00");
  const period = match[3]?.toLowerCase();
  if (minute > 59) return null;

  if (period) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (period === "pm" ? 12 : 0);
  } else if (hour > 23) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export function PlaceTimePopover({
  blockId,
  itemId,
  time,
  timeEnd,
}: PlaceTimePopoverProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const [active, setActive] = useState<ActiveField>("start");
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const parsedStart = parseTimeInput(draftStart);
  const parsedEnd = parseTimeInput(draftEnd);
  const startInvalid = draftStart.trim() !== "" && !parsedStart;
  const endInvalid = draftEnd.trim() !== "" && !parsedEnd;
  const canSave = !!parsedStart && !endInvalid;
  const activeDraft = active === "start" ? parsedStart : parsedEnd;
  const activeInvalid = active === "start" ? startInvalid : endInvalid;

  const filtered = query
    ? TIME_SLOTS.filter((s) =>
        formatDisplayTime(s).toLowerCase().includes(query.toLowerCase()),
      )
    : TIME_SLOTS;
  const suggestedSlots =
    activeDraft && !TIME_SLOTS.includes(activeDraft)
      ? [activeDraft, ...filtered]
      : filtered;

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setDraftStart(time ? formatDisplayTime(time) : "");
      setDraftEnd(timeEnd ? formatDisplayTime(timeEnd) : "");
      setActive("start");
      setQuery("");
    }
    setOpen(isOpen);
  }

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>("[data-selected=true]");
    el?.scrollIntoView({ block: "center" });
  }, [open, active]);

  function handleSlotSelect(slot: string) {
    if (active === "start") {
      setDraftStart(formatDisplayTime(slot));
      setActive("end");
      endInputRef.current?.focus();
    } else {
      setDraftEnd(formatDisplayTime(slot));
    }
    setQuery("");
  }

  function handleSave() {
    if (!canSave || !parsedStart) return;
    updatePlaceItem({
      blockId,
      itemId,
      updates: {
        time: parsedStart,
        timeEnd: parsedEnd ?? undefined,
      },
    });
    setOpen(false);
  }

  function handleClear() {
    updatePlaceItem({
      blockId,
      itemId,
      updates: { time: undefined, timeEnd: undefined },
    });
    setDraftStart("");
    setDraftEnd("");
    setOpen(false);
  }

  const triggerLabel =
    time && timeEnd
      ? `${formatDisplayTime(time)} – ${formatDisplayTime(timeEnd)}`
      : time
        ? formatDisplayTime(time)
        : "Add time";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={
          time
            ? "inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-muted px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
            : "inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <Clock className="size-3.5" aria-hidden="true" />
        {triggerLabel}
      </PopoverTrigger>

      <PopoverContent
        className="w-72 overflow-hidden p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Time range row */}
        <div className="flex items-center gap-2 p-3">
          <Input
            value={draftStart}
            onChange={(e) => {
              setDraftStart(e.target.value);
              setQuery(e.target.value);
              setActive("start");
            }}
            onFocus={() => {
              setActive("start");
              setQuery("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Start time"
            className={cn(
              "h-9 rounded-sm text-sm",
              active === "start" && "ring-2 ring-ring/30",
            )}
            aria-label="Start time"
            aria-invalid={startInvalid}
            aria-describedby={active === "start" ? hintId : undefined}
          />
          <span className="shrink-0 text-muted-foreground">—</span>
          <Input
            ref={endInputRef}
            value={draftEnd}
            onChange={(e) => {
              setDraftEnd(e.target.value);
              setQuery(e.target.value);
              setActive("end");
            }}
            onFocus={() => {
              setActive("end");
              setQuery("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="End time"
            className={cn(
              "h-9 rounded-sm text-sm",
              active === "end" && "ring-2 ring-ring/30",
            )}
            aria-label="End time"
            aria-invalid={endInvalid}
            aria-describedby={active === "end" ? hintId : undefined}
          />
        </div>

        {/* Active field label */}
        <p
          id={hintId}
          className={cn(
            "px-3 pb-1 text-xs text-muted-foreground",
            activeInvalid && "text-destructive",
          )}
        >
          {activeInvalid
            ? "Enter a valid time, e.g. 9:11 AM."
            : `Type or select ${active} time, e.g. 9:11 AM.`}
        </p>

        {/* Scrollable slots */}
        <div
          ref={listRef}
          className="h-48 overflow-y-auto border-t border-border"
        >
          {suggestedSlots.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results
            </p>
          ) : (
            suggestedSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                data-selected={activeDraft === slot}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                  activeDraft === slot && "bg-muted font-semibold text-foreground",
                )}
                onClick={() => handleSlotSelect(slot)}
              >
                {formatDisplayTime(slot)}
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full px-5"
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full px-5"
            disabled={!canSave}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
