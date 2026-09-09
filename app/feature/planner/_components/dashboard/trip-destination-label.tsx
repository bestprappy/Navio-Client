"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

export function TripDestinationLabel({ destinations }: { destinations: readonly string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? destinations : destinations.slice(0, 3);
  return <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm" aria-label="Trip destinations">
    <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
    {visible.map((name) => <span key={name} className="max-w-full truncate rounded-md border border-border bg-card/85 px-2 py-1 text-foreground" title={name}>{name}</span>)}
    {destinations.length > 3 && <button type="button" className="rounded-md px-2 py-1 text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : `+${destinations.length - 3} more`}</button>}
  </div>;
}
