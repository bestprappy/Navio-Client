"use client";

import { useId, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, ChevronDown, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TripDestination } from "../constants/types";
import { DestinationSearch } from "./destination-search";

type Props = {
  destination: TripDestination;
  isOverride: boolean;
  isFirstDay: boolean;
  onChange: (destination: TripDestination | null) => Promise<void>;
};

export function DayDestinationPicker({ destination, isOverride, isFirstDay, onChange }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const reset = useMutation({
    mutationFn: () => onChange(null),
    onSuccess: () => setOpen(false),
  });
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-secondary/30 p-3">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => { setOpen(!open); reset.reset(); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">{isFirstDay ? "Trip destination" : isOverride ? "New destination from this day" : "Destination"}</span><span className="block break-words font-semibold">{destination.name}</span></span>
        <span className="text-xs text-primary">Change</span><ChevronDown className="size-4 shrink-0" aria-hidden="true" />
      </button>
      {open && <div id={id} className="mt-3 space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">Applies from this day until your next destination change. Your existing stops stay in place.</p>
        <DestinationSearch
          disabled={reset.isPending}
          onEscape={() => setOpen(false)}
          onSelect={async (next) => { await onChange(next); setOpen(false); }}
        />
        {reset.isError && <p role="alert" className="text-xs text-destructive">{reset.error.message}</p>}
        {reset.isPending && <p role="status" className="text-xs text-muted-foreground">Saving destination…</p>}
        <div className="flex flex-wrap gap-2">
          {isOverride && !isFirstDay && <Button type="button" variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}><Check className="size-4" />Use previous destination</Button>}
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}><X className="size-4" />Close</Button>
        </div>
      </div>}
    </div>
  );
}
