"use client";
import { dayAutomationHistoryAtom } from "./day-automation-history";
import { AutoAddThreshold } from "./auto-add-threshold";
import { AutoAddPreview } from "./auto-add-preview";
import { AutoAddGuidance, type AutoAddBlocker } from "./auto-add-guidance";
import { dayHasNoAutoAddSlot, lowestStopArrivalPct } from "./day-charging-need";
import { useTripCharging } from "../garage/use-trip-charging";
import { energyModelForCar } from "../garage/trip-energy-projection";
import { canAutomaticallyPlan } from "../garage/energy-selection";
import { useRequireAuth } from "@/hooks/use-require-auth";

import { useEffect, useMemo, useState } from "react";
import { BatteryCharging, CheckCircle2, Loader2 } from "lucide-react";
import { atom, useAtomValue, useSetAtom, useStore } from "jotai";
import { optimizationStateKey, prepareOptimizationSnapshot } from "@/app/feature/planner/_components/optimization-state";
import { tripEnergyStateAtom } from "../garage/trip-energy-state";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import {
  applyTripEvOptimization,
  isPersistedTripId,
  PlannerApiError,
  previewTripEvOptimization,
  type EvOptimizationPreview,
  type EvOptimizationRequestPayload,
} from "@/app/feature/planner/_components/planner-api";
import { Button } from "@/components/ui/button";

import type { EvCar } from "../constants/vehicle.types";
import { batteryThresholdPctAtom } from "../garage/garage.atoms";
import { applyPlannerServerSnapshotAtom, tripBlocksAtom, tripBudgetAtom, tripCurrencyAtom, tripExpensesAtom } from "../overview/trip-builder.atoms";

const optimizationBudgetAtom = atom(get => ({
  amount: get(tripBudgetAtom), currency: get(tripCurrencyAtom).code, expenses: get(tripExpensesAtom),
}));

type EvRouteOptimizationPanelProps = {
  blockId: string | null;
  vehicle: EvCar | null;
  startingSocPct: number;
  /** Runs before the planner scrolls to vehicle settings, for example to close a dialog. */
  onOpenVehicleSettings?: () => void;
};

type PreviewState = {
  data: EvOptimizationPreview;
  payload: EvOptimizationRequestPayload;
  key: string;
};

function getMutationError(error: unknown): string {
  if (error instanceof PlannerApiError && error.status === 409) {
    return "The trip changed after this preview. Preview the route again.";
  }
  // A rejected route (422) carries the reason, such as a missing start or destination.
  if (error instanceof PlannerApiError && error.status === 422 && error.detail) {
    return `${error.message}. ${error.detail.replace(/\.$/, "")}.`;
  }
  return error instanceof Error
    ? error.message
    : "The EV route could not be optimized.";
}

export function EvRouteOptimizationPanel({
  blockId,
  vehicle,
  startingSocPct,
  onOpenVehicleSettings,
}: EvRouteOptimizationPanelProps) {
  const params = useParams<{ planId: string }>();
  const { isAuthenticated, isAuthenticationLoading, requireAuth } = useRequireAuth();
  const tripId = isPersistedTripId(params.planId) ? params.planId : null;
  const applyServerSnapshot = useSetAtom(applyPlannerServerSnapshotAtom);
  const blocks = useAtomValue(tripBlocksAtom);
  const energyState = useAtomValue(tripEnergyStateAtom);
  const budget = useAtomValue(optimizationBudgetAtom);
  const store = useStore();
  const reserveSocPct = useAtomValue(batteryThresholdPctAtom);
  const setHistory = useSetAtom(dayAutomationHistoryAtom);
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  const payload = useMemo<EvOptimizationRequestPayload | null>(() => {
    if (!blockId || !vehicle) return null;
    return {
      blockId,
      vehicle: {
        energyModel: energyModelForCar(vehicle),
        batteryKwh: vehicle.batteryKwh,
        consumptionKwhPer100km: vehicle.consumptionKwhPer100km,
        maxAcKw: vehicle.maxAcKw,
        maxDcKw: vehicle.maxDcKw,
        connectorTypes: vehicle.connectorTypes,
      },
      startingSocPct,
      reserveSocPct,
      targetSocPct: 100,
      insertionOnly: true,
      maximumDetourKm: 20,
    };
  }, [blockId, reserveSocPct, startingSocPct, vehicle]);
  const requestKey = payload ? optimizationStateKey(payload, blocks, energyState, budget) : null;
  const currentPreview =
    previewState && previewState.key === requestKey ? previewState : null;

  const previewMutation = useMutation({
    mutationFn: async ({ request, key }: { request: EvOptimizationRequestPayload; key: string }) => {
      if (!tripId) {
        throw new PlannerApiError(
          "Save this trip before using EV route optimization.",
          400,
        );
      }
      const snapshot = await prepareOptimizationSnapshot(tripId);
      if (key !== optimizationStateKey(request, store.get(tripBlocksAtom), store.get(tripEnergyStateAtom), store.get(optimizationBudgetAtom))) {
        throw new PlannerApiError("The trip changed while preparing optimization. Preview again.", 409);
      }
      if (!snapshot.capabilities?.includes("day-auto-add-v1")) throw new PlannerApiError("Auto Add needs the day charging server update before it can preserve all your stops.", 409);
      const needsTargets = blocks.some((block) => block.items.some((item) => item.type === "place" && item.evCharger?.targetBatteryPct != null));
      const needsDestinations = blocks.some((block) => block.destination);
      if ((needsTargets && !snapshot.capabilities?.includes("charge-targets")) || (needsDestinations && !snapshot.capabilities?.includes("day-destinations"))) {
        throw new PlannerApiError("Route optimization needs the server update to preserve your destination changes and charging targets. You can continue editing your itinerary.", 409);
      }
      return previewTripEvOptimization(tripId, { ...request, expectedVersion: snapshot.version });
    },
    onMutate: () => {
      setAppliedMessage(null);
      setPreviewState(null);
    },
    onSuccess: (data, { request, key }) => {
      setPreviewState({ data, payload: request, key });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (state: PreviewState) => {
      if (!tripId || !canAutomaticallyPlan(vehicle)) {
        throw new PlannerApiError(
          "Confirm the vehicle energy selection before applying EV route optimization.",
          400,
        );
      }
      const snapshot = await prepareOptimizationSnapshot(tripId);
      if (snapshot.version !== state.data.baseVersion || state.key !== optimizationStateKey(state.payload, store.get(tripBlocksAtom), store.get(tripEnergyStateAtom), store.get(optimizationBudgetAtom))) {
        throw new PlannerApiError("The trip changed after this preview. Preview the route again.", 409);
      }
      return applyTripEvOptimization(tripId, {
        ...state.payload,
        expectedVersion: state.data.baseVersion,
      });
    },
    onSuccess: (snapshot, state) => {
      if (!tripId) return;
      if (state.key !== optimizationStateKey(state.payload, store.get(tripBlocksAtom), store.get(tripEnergyStateAtom), store.get(optimizationBudgetAtom))) {
        setPreviewState(null);
        throw new PlannerApiError("Charging changes were saved, but newer local edits were kept on this device. Reconcile the saved trip before retrying.", 409);
      }
      const before = store.get(tripBlocksAtom);
      applyServerSnapshot({ tripId, ...snapshot });
      const previousDay = before.find(day => day.id === state.payload.blockId);
      const nextDay = store.get(tripBlocksAtom).find(day => day.id === state.payload.blockId);
      if (previousDay && nextDay) setHistory(history => ({ ...history, [previousDay.id]: { before: previousDay, after: JSON.stringify(nextDay) } }));
      setPreviewState(null);
      setAppliedMessage("Charging stops added to this day. Undo it from the day in your itinerary.");
    },
  });

  const charging = useTripCharging();
  const day = blockId ? charging?.days.get(blockId) : null;
  const dayBlock = blocks.find(block => block.id === blockId);
  // Lists sit in the same block array; number only itinerary days, as the itinerary does.
  const dayIndex = blocks.filter(block => block.kind === "itinerary").findIndex(block => block.id === blockId);
  const satisfied = dayHasNoAutoAddSlot(day, dayBlock, reserveSocPct);
  const lowestStopPct = lowestStopArrivalPct(day, dayBlock);
  const canPreview = Boolean(tripId && payload && !satisfied);
  const operations = currentPreview?.data.operations ?? [];
  const canApply = Boolean(
    canAutomaticallyPlan(vehicle) && currentPreview?.data.feasible && operations.length > 0,
  );
  const error = previewMutation.error ?? applyMutation.error;
  const energyConfirmed = canAutomaticallyPlan(vehicle);
  const blocker: AutoAddBlocker | null = !vehicle
    ? "no-vehicle"
    : !tripId
      ? "unsaved-trip"
      : !energyConfirmed
        ? "energy-unconfirmed"
        : !isAuthenticated && !isAuthenticationLoading
          ? "sign-in"
          : satisfied
            ? "satisfied"
            : currentPreview && !currentPreview.data.feasible
              ? "infeasible"
              : null;

  const { mutate: checkCharging } = previewMutation;
  useEffect(() => {
    if (!payload || !requestKey || !canPreview || !isAuthenticated || !canAutomaticallyPlan(vehicle)) return;
    const timer = setTimeout(() => checkCharging({ request: payload, key: requestKey }), 800);
    return () => clearTimeout(timer);
  }, [payload, requestKey, canPreview, isAuthenticated, vehicle, checkCharging]);

  function previewRoute() {
    if (!payload || !tripId) return;
    applyMutation.reset();
    previewMutation.mutate({ request: payload, key: requestKey! });
  }

  function applyPreview() {
    if (!currentPreview || !tripId || !canApply) return;
    applyMutation.mutate(currentPreview);
  }

  const stopCount = operations.length;
  const actionLabel = previewMutation.isPending
    ? "Checking where to charge…"
    : applyMutation.isPending
      ? "Adding charging stops…"
      : canApply
        ? `Add ${stopCount} charging ${stopCount === 1 ? "stop" : "stops"}`
        : "Add charging stops";

  return (
    <section aria-labelledby="auto-add-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="auto-add-heading" className="text-sm font-semibold text-foreground">Auto Add charging stops</h3>
        {dayIndex >= 0 ? <span className="shrink-0 text-xs font-medium text-primary">Day {dayIndex + 1}</span> : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Adds compatible chargers to this day only where the battery needs one. Your stops stay as they are, and new chargers charge to 100%.
      </p>

      <div className="mt-4">
        <AutoAddThreshold disabled={!vehicle} lowestStopPct={lowestStopPct} />
      </div>

      <Button
        type="button"
        size="lg"
        className="mt-4 h-10 w-full rounded-sm"
        data-tour="planner.ev-optimize"
        disabled={isAuthenticationLoading || !canApply || satisfied || previewMutation.isPending || applyMutation.isPending}
        onClick={() => requireAuth(applyPreview)}
      >
        {previewMutation.isPending || applyMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <BatteryCharging className="size-4" aria-hidden="true" />
        )}
        {actionLabel}
      </Button>

      <AutoAddGuidance blocker={blocker} onOpenVehicleSettings={onOpenVehicleSettings} />

      {error ? (
        <div className="mt-3 flex items-start justify-between gap-2 rounded-sm bg-destructive/10 px-3 py-2" role="alert">
          <p className="text-xs leading-5 text-destructive">{getMutationError(error)}</p>
          <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-destructive" onClick={previewRoute}>Check again</Button>
        </div>
      ) : null}

      {appliedMessage ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-primary" role="status">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {appliedMessage}
        </p>
      ) : null}

      {currentPreview ? <AutoAddPreview preview={currentPreview.data} day={dayBlock} /> : null}
    </section>
  );
}
