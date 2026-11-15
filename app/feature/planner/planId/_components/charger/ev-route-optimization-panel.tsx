"use client";
import { dayAutomationHistoryAtom } from "./day-automation-history";
import { ChargingPreferences } from "./charging-preferences";
import { DayRouteOptimizer } from "./day-route-optimizer";
import { AutoAddGuidance, type AutoAddBlocker } from "./auto-add-guidance";
import { dayHasNoAutoAddSlot } from "./day-charging-need";
import { useTripCharging } from "../garage/use-trip-charging";
import { energyModelForCar } from "../garage/trip-energy-projection";
import { canAutomaticallyPlan } from "../garage/energy-selection";
import { useRequireAuth } from "@/hooks/use-require-auth";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Route, Sparkles } from "lucide-react";
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
import { batteryThresholdPctAtom, minimumArrivalPctAtom } from "../garage/garage.atoms";
import { formatMinutes } from "../garage/garage-formatters";
import { describeOperation, operationKey } from "./ev-optimization-format";
import { applyPlannerServerSnapshotAtom, tripBlocksAtom, tripBudgetAtom, tripCurrencyAtom, tripExpensesAtom } from "../overview/trip-builder.atoms";

const optimizationBudgetAtom = atom(get => ({
  amount: get(tripBudgetAtom), currency: get(tripCurrencyAtom).code, expenses: get(tripExpensesAtom),
}));

type EvRouteOptimizationPanelProps = {
  blockId: string | null;
  vehicle: EvCar | null;
  startingSocPct: number;
  showOptimizer?: boolean;
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
  showOptimizer = true,
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
  const minimumArrivalSocPct = useAtomValue(minimumArrivalPctAtom);
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
      minimumArrivalSocPct,
      maximumDetourKm: 20,
    };
  }, [blockId, reserveSocPct, startingSocPct, minimumArrivalSocPct, vehicle]);
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
      setAppliedMessage("Charging stops were applied to this day.");
    },
  });

  const charging = useTripCharging();
  const day = blockId ? charging?.days.get(blockId) : null;
  const satisfied = dayHasNoAutoAddSlot(day, blocks.find(block => block.id === blockId),
    { batteryThresholdPct: reserveSocPct, minimumArrivalPct: minimumArrivalSocPct });
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

  return (
    <div className="mt-4 border-t border-primary/15 pt-3" data-tour="planner.ev-optimize">
      <div className="flex items-center gap-2">
        <Route className="size-4 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Auto Add
          </p>
          <p className="text-xs text-muted-foreground">
            Adds only necessary charging stops to this day. Existing stops and charging targets are preserved.
          </p>
        </div>
      </div>

      <ChargingPreferences disabled={!vehicle} />
      <Button
        type="button"
        size="lg"
        className="mt-3 h-10 w-full rounded-sm"
        disabled={isAuthenticationLoading || !canApply || satisfied || previewMutation.isPending || applyMutation.isPending}
        onClick={() => requireAuth(applyPreview)}
      >
        {previewMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="size-4" aria-hidden="true" />
        )}
        {previewMutation.isPending ? "Checking charging needs…" : "Auto Add"}
      </Button>

      <AutoAddGuidance blocker={blocker} onOpenVehicleSettings={onOpenVehicleSettings} />

      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {getMutationError(error)}
          <Button variant="ghost" size="sm" onClick={previewRoute}>Retry</Button>
        </p>
      ) : null}

      {appliedMessage ? (
        <p
          className="mt-2 flex items-start gap-1.5 text-xs text-primary"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-3.5" aria-hidden="true" />
          {appliedMessage}
        </p>
      ) : null}

      {currentPreview ? (
        <div className="mt-3 rounded-sm border border-border bg-background/80 p-3">
          <p className="text-sm font-medium text-foreground">
            {currentPreview.data.message}
          </p>
          {operations.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {operations.map((operation, index) => (
                <li key={operationKey(operation, index)}>
                  {describeOperation(operation)}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {currentPreview.data.finalSocPct === null ? "Final battery unavailable" : `Finish at ${currentPreview.data.finalSocPct.toFixed(1)}% battery`}
            {currentPreview.data.totalChargingMinutes > 0
              ? ` · ${formatMinutes(currentPreview.data.totalChargingMinutes)} charging`
              : ""}
          </p>
          {currentPreview.data.warnings.map((warning) => (
            <p key={warning} className="mt-1 text-xs text-muted-foreground">
              {warning}
            </p>
          ))}

        </div>
      ) : null}
      {showOptimizer && <DayRouteOptimizer blockId={blockId} />}
    </div>
  );
}
