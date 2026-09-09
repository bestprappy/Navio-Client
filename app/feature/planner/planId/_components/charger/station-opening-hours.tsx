"use client";

import { Clock } from "lucide-react";
import { formatOpeningHours } from "./opening-hours";

export function StationOpeningHours({ value }: { value?: string | null }) {
  const { summary, rows } = formatOpeningHours(value);
  return (
    <div className="min-w-0 text-sm">
      <p className="flex items-start gap-2 text-muted-foreground">
        <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 break-words leading-relaxed">{summary}</span>
      </p>
      {rows.length > 0 && (
        <dl className="mt-2 grid gap-1.5 rounded-xl bg-muted/50 p-3">
          {rows.map((row, index) => (
            <div key={`${row.days}-${index}`} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 text-xs leading-relaxed">
              <dt className="font-medium text-foreground">{row.days}</dt>
              <dd className="min-w-0 break-words text-muted-foreground">{row.hours}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
