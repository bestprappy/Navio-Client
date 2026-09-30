"use client";

import { useSyncExternalStore } from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

import { getOpeningHoursSchedule, type OpenSegment, type ScheduleRow } from "./opening-hours";

const DAY_MINUTES = 24 * 60;

const noopSubscribe = () => () => {};
/** Monday = 0. Resolved on the client only so SSR markup never disagrees on "today". */
const getTodayIndex = () => (new Date().getDay() + 6) % 7;
const getServerTodayIndex = () => -1;

function DayTrack({ segments }: { segments: OpenSegment[] }) {
  return (
    <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
      <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
      {segments.map(([start, end]) => (
        <span
          key={`${start}-${end}`}
          className="absolute inset-y-0 rounded-full bg-primary"
          style={{ left: `${(start / DAY_MINUTES) * 100}%`, width: `${((end - start) / DAY_MINUTES) * 100}%` }}
        />
      ))}
    </span>
  );
}

function ScheduleDay({ row, isToday }: { row: ScheduleRow; isToday: boolean }) {
  const isClosed = row.segments?.length === 0;
  return (
    <div
      aria-current={isToday ? "date" : undefined}
      className={cn(
        "grid grid-cols-[4.5rem_minmax(2.5rem,1fr)_auto] items-center gap-3 rounded-sm px-2 py-1.5",
        isToday && "bg-primary/10",
      )}
    >
      <dt className={cn("text-muted-foreground", isToday && "font-semibold text-foreground")}>
        {row.label}
        {isToday ? <span className="sr-only"> (today)</span> : null}
      </dt>
      <dd className="contents">
        {row.segments ? <DayTrack segments={row.segments} /> : <span aria-hidden="true" />}
        <span
          className={cn(
            "text-right tabular-nums",
            isClosed ? "text-muted-foreground" : "font-medium text-foreground",
          )}
        >
          {row.hours}
        </span>
      </dd>
    </div>
  );
}

export function StationOpeningHours({ value }: { value?: string | null }) {
  const schedule = getOpeningHoursSchedule(value);
  const today = useSyncExternalStore(noopSubscribe, getTodayIndex, getServerTodayIndex);

  return (
    <section aria-label="Opening hours" className="min-w-0 text-xs leading-relaxed">
      <p className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
        <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        Opening hours
      </p>
      {schedule.kind === "text" ? (
        <p className="wrap-break-word pl-6 text-sm text-foreground">{schedule.text}</p>
      ) : (
        <dl className="grid gap-0.5 pl-4">
          {schedule.rows.map((row) => (
            <ScheduleDay
              key={row.label}
              row={row}
              isToday={schedule.rows.length > 1 && today >= row.startDay && today <= row.endDay}
            />
          ))}
        </dl>
      )}
    </section>
  );
}
