"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Compass, Leaf, MapPin } from "lucide-react";
import type { TripResponse } from "../planner-api";
import { useTripPlanStats } from "./use-trip-plan-stats";
import { buildTripHref } from "./trip-dashboard.utils";

export function TripPreparation({ trip }: { trip: TripResponse }) {
  const stats = useTripPlanStats(trip.id);
  const steps = [
    { label: "Choose your dates", done: Boolean(trip.startDate && trip.endDate) },
    { label: "Save a few places", done: (stats.data?.placeCount ?? 0) > 0 },
    { label: "Check charging stops", done: (stats.data?.chargerCount ?? 0) > 0 },
    { label: "Make a packing list", done: (stats.data?.checklistTotalCount ?? 0) > 0 },
  ];
  return <aside aria-label="Planning companion" className="flex flex-col gap-4">
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-3"><Compass className="size-5 text-primary" /><h2 className="font-semibold">Before you head out</h2></div>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">A few small steps for a smoother trip.</p>
      <ul className="space-y-1">{steps.map((step) => <li key={step.label}><Link href={buildTripHref(trip)} className="flex items-center gap-3 rounded-lg py-3 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${step.done ? "border-success/40 bg-success/15 text-success" : "border-input"}`}>{step.done && <Check className="size-3" />}</span>{step.label}<span className="sr-only">{step.done ? "Done" : "Open planner"}</span></Link></li>)}</ul>
      <div className="mt-3 border-t border-border pt-4 text-xs text-muted-foreground">{steps.filter((step) => step.done).length} of {steps.length} essentials ready</div>
    </div>
    <Link href="/explore" className="group rounded-xl border border-accent/35 bg-accent/5 p-5 focus-visible:ring-2 focus-visible:ring-ring">
      <div className="mb-3 flex justify-between"><MapPin className="size-5 text-accent" /><ArrowUpRight className="size-4 text-accent transition-transform group-hover:-translate-y-0.5" /></div>
      <h2 className="font-semibold">Take the scenic route</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Find a local stop, a quiet detour, or a route worth making your own.</p>
    </Link>
    <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4 text-sm leading-relaxed text-muted-foreground"><Leaf className="mt-0.5 size-5 shrink-0 text-success" />Leave room for an unplanned stop. Your itinerary can change along the way.</div>
  </aside>;
}
