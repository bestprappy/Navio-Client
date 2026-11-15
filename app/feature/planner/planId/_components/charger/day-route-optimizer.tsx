"use client";
import { dayAutomationHistoryAtom, routeStrategyAtom, flexibleChargingAtom } from "./day-automation-history";
import { useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { tripBlocksAtom, plannerReadOnlyAtom, evChargerToPlaceItem } from "../overview/trip-builder.atoms";
import { activeEvCarAtom, startingBatteryPctAtom, batteryThresholdPctAtom, minimumArrivalPctAtom } from "../garage/garage.atoms";
import { projectCanonicalTrip, chargingEventForCar } from "../garage/trip-energy-projection";
import { canAutomaticallyPlan } from "../garage/energy-selection";
import { getTripRouteGroups } from "../routes/trip-route.helpers";
import { fetchTripRoutes } from "../routes/trip-route-api";
import { useTripRoutes } from "../routes/trip-route-query";
import { type TripBlockData, isPlaceItem } from "../constants/types";
import { dayOrderCandidates, meaningfulImprovement, movable, routeMetrics, routeScore, type RouteStrategy, type RouteMetrics } from "./day-route-optimization";
import { fetchEvChargersNear } from "./ev-station-api";
import { dayHasNoAutoAddSlot } from "./day-charging-need";

type Proposal = { day: TripBlockData; key: string; before: RouteMetrics; after: RouteMetrics; arrival: number; changes: string[] };
export function DayRouteOptimizer({ blockId }: { blockId: string | null }) {
  const blocks = useAtomValue(tripBlocksAtom), setBlocks = useSetAtom(tripBlocksAtom), store = useStore();
  const car = useAtomValue(activeEvCarAtom), initial = useAtomValue(startingBatteryPctAtom);
  const threshold = useAtomValue(batteryThresholdPctAtom), arrival = useAtomValue(minimumArrivalPctAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const routes = useTripRoutes();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const [strategy, setStrategy] = useAtom(routeStrategyAtom);
  const [flexible, setFlexible] = useAtom(flexibleChargingAtom);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const setHistory = useSetAtom(dayAutomationHistoryAtom);
  const key = JSON.stringify([blocks, car, initial, threshold, arrival, strategy, flexible]);
  const current = proposal?.key === key ? proposal : null;
  const day = blocks.find(b => b.id === blockId);

  async function preview() {
    if (!day || !car || !canAutomaticallyPlan(car) || !routes.data) return;
    controller.current?.abort();
    controller.current = new AbortController();
    const signal = controller.current.signal;
    setBusy(true); setProposal(null); setMessage("");
    try {
      const baseSegments = (await fetchTripRoutes({ profile: "driving-traffic", groups: getTripRouteGroups(blocks).filter(g => g.blockId === day.id) }, signal)).segments;
      const before = routeMetrics(baseSegments);
      if (!before) throw new Error("Road distance and travel time are required. Mixed travel modes cannot be optimized automatically.");
      const originalProjection = projectCanonicalTrip(blocks, [...routes.data.segments.filter(s => s.blockId !== day.id), ...baseSegments], car, initial, threshold);
      const candidates = dayOrderCandidates(day, flexible);
      if (flexible) {
        const existing = new Set(day.items.filter(isPlaceItem).map(item => item.placeId));
        for (const stop of day.items.slice(1, -1).filter(isPlaceItem).filter(item => item.evCharger && movable(item, true)).slice(0, 6)) {
          signal.throwIfAborted();
          const stations = await fetchEvChargersNear(stop.lat, stop.lng);
          for (const station of stations.filter(s => s.status === "active" && !existing.has(`ev-charger:${s.id}`)).slice(0, 4)) {
            const replacement = evChargerToPlaceItem(station, stop.id);
            replacement.evCharger = { ...replacement.evCharger!, targetBatteryPct: stop.evCharger!.targetBatteryPct, plannedDepartureSocPct: stop.evCharger!.plannedDepartureSocPct, chargingDurationMinutes: stop.evCharger!.chargingDurationMinutes, estimatedChargeMinutes: stop.evCharger!.estimatedChargeMinutes };
            const charging = chargingEventForCar(replacement.evCharger, car);
            if (charging.compatible !== true || !charging.effectivePowerKw) continue;
            // Preserve all user fields; replace only station identity and specifications.
            candidates.push({ ...day, items: day.items.map(item => item.id === stop.id ? { ...stop, placeId: replacement.placeId, name: replacement.name, address: replacement.address, lat: replacement.lat, lng: replacement.lng, evCharger: replacement.evCharger } : item) });
          }
        }
      }
      let best: Proposal | null = null;
      for (const candidate of candidates) {
        if (JSON.stringify(store.get(tripBlocksAtom)) !== JSON.stringify(blocks)) throw new Error("The itinerary changed. Preview again.");
        const next = blocks.map(b => b.id === day.id ? candidate : b);
        const result = await fetchTripRoutes({ profile: "driving-traffic", groups: getTripRouteGroups(next).filter(g => g.blockId === day.id) }, signal);
        const metrics = routeMetrics(result.segments);
        if (!metrics || !meaningfulImprovement(before, metrics, strategy) || (best && routeScore(metrics, strategy) >= routeScore(best.after, strategy))) continue;
        const proposedTrip = projectCanonicalTrip(next, [...routes.data.segments.filter(s => s.blockId !== day.id), ...result.segments], car, initial, threshold);
        const projection = proposedTrip.days.get(day.id);
        if ([...proposedTrip.days].some(([id, state]) => id !== day.id && state.infeasible && !originalProjection.days.get(id)?.infeasible)) continue;
        const states = projection ? [...projection.batteryByItemId.values()] : [];
        const prefs = { batteryThresholdPct: threshold, minimumArrivalPct: arrival };
        if (!projection || projection.infeasible || projection.startDisconnected || states.length < 2
          || states.some(s => s.rawPredictedArrivalSocPct == null || s.departureSocPct == null)
          || !dayHasNoAutoAddSlot(projection, candidate, prefs)) continue;
        const changes = candidate.items.flatMap((item, index) => {
          const original = day.items.find(i => i.id === item.id)!;
          if (isPlaceItem(item) && isPlaceItem(original) && item.placeId !== original.placeId) return [`Replace ${original.name} with ${item.name}; keep its charging target.`];
          return item.id !== day.items[index].id && isPlaceItem(item) ? [`Move ${item.name} to position ${index + 1}.`] : [];
        });
        best = { day: candidate, key, before, after: metrics, arrival: states.at(-1)!.rawPredictedArrivalSocPct!, changes };
      }
      setProposal(best);
      if (!best) setMessage("No meaningful improvement was found within this day's stop constraints and battery requirements.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Route optimization is unavailable."); }
    finally { setBusy(false); }
  }
  return <section className="mt-4 border-t border-border pt-4" aria-label="Optimize Route">
    <details className="rounded-sm border border-border bg-background p-3">
      <summary className="cursor-pointer text-sm font-medium">Optimize settings</summary>
      <div className="mt-3 space-y-4">
        <RadioGroup aria-label="Route optimization strategy" value={strategy} onValueChange={v => setStrategy(v as RouteStrategy)}>
          {([['backtracking', 'Avoid Repeated Routes'], ['distance', 'Shortest Distance'], ['time', 'Fastest Route']] as const).map(([value, label]) => <label key={value} className="flex min-h-9 items-center gap-2 text-sm"><RadioGroupItem value={value} />{label}</label>)}
        </RadioGroup>
        <RadioGroup aria-label="Charging stop handling" value={flexible ? "flexible" : "keep"} onValueChange={v => setFlexible(v === "flexible")}>
          <label className="flex min-h-9 items-center gap-2 text-sm"><RadioGroupItem value="keep" />Keep Existing Charging Stations</label>
          <label className="flex min-h-9 items-center gap-2 text-sm"><RadioGroupItem value="flexible" />Allow Charging Station Changes</label>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">Fixed times, activities, notes, locked stops and day endpoints stay in place. Changes must save at least 2% and 250 m or 1 minute. Charging targets are preserved.</p>
      </div>
    </details>
    <Button variant="outline" className="mt-3 w-full" disabled={busy || readOnly || !day || !car || !canAutomaticallyPlan(car) || !routes.data} onClick={preview}>{busy ? "Comparing road routes…" : "Optimize Route"}</Button>
    {message && <p role="status" className="mt-2 text-xs text-muted-foreground">{message}</p>}
    {current && <div className="mt-3 space-y-3 rounded-sm border border-border bg-background p-3">
      <p className="text-sm font-medium">Review changes for this day</p>
      <p className="text-xs">{(current.before.distanceMeters / 1000).toFixed(1)} → {(current.after.distanceMeters / 1000).toFixed(1)} km · {Math.round(current.before.seconds / 60)} → {Math.round(current.after.seconds / 60)} min · arrive at {current.arrival.toFixed(1)}%</p>
      <ul className="list-disc space-y-1 pl-4 text-xs">{current.changes.map(c => <li key={c}>{c}</li>)}</ul>
      <Button disabled={readOnly} onClick={() => { if (!day || current.key !== key) return; setHistory(history => ({ ...history, [day.id]: { before: day, after: JSON.stringify(current.day) } })); setBlocks(previous => previous.map(b => b.id === day.id ? current.day : b)); setProposal(null); setMessage("Route optimized for this day. Battery projections are recalculating."); }}>Apply optimization</Button>
    </div>}
  </section>;
}
