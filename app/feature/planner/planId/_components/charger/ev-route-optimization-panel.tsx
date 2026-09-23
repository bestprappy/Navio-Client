"use client";
import { energyModelForCar } from "../garage/trip-energy-projection";
import { canAutomaticallyPlan } from "../garage/energy-selection";
import { useRequireAuth } from "@/hooks/use-require-auth";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Route, Sparkles } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import {
  applyTripEvOptimization,
  getPlannerSnapshot,
  isPersistedTripId,
  PlannerApiError,
  previewTripEvOptimization,
  type EvOptimizationOperation,
  type EvOptimizationPreview,
  type EvOptimizationRequestPayload,
} from "@/app/feature/planner/_components/planner-api";
import { Button } from "@/components/ui/button";

import type { EvCar } from "../constants/vehicle.types";
import { applyPlannerServerSnapshotAtom, tripBlocksAtom } from "../overview/trip-builder.atoms";

type EvRouteOptimizationPanelProps = {
  blockId: string | null;
  vehicle: EvCar | null;
  startingSocPct: number;
  targetSocPct: number;
};

type PreviewState = {
  data: EvOptimizationPreview;
  payload: EvOptimizationRequestPayload;
  key: string;
};

function getRequestKey(payload: EvOptimizationRequestPayload): string {
  return JSON.stringify(payload);
}

function describeOperation(operation: EvOptimizationOperation): string {
  const chargerName = operation.charger?.name ?? "charger stop";
  switch (operation.type) {
    case "ADD_CHARGER":
      return `Add ${chargerName} (${operation.estimatedChargeMinutes} min)`;
    case "REPLACE_CHARGER":
      return `Replace the unlocked stop with ${chargerName}`;
    case "REMOVE_CHARGER":
      return "Remove an unnecessary unlocked charger";
    case "UPDATE_CHARGER":
      return `Refresh ${chargerName} and its charging estimate`;
  }
}

function getMutationError(error: unknown): string {
  if (error instanceof PlannerApiError && error.status === 409) {
    return "The trip changed after this preview. Preview the route again.";
  }
  return error instanceof Error
    ? error.message
    : "The EV route could not be optimized.";
}

export function EvRouteOptimizationPanel({
  blockId,
  vehicle,
  startingSocPct,
  targetSocPct,
}: EvRouteOptimizationPanelProps) {
  const params = useParams<{ planId: string }>();
  const { isAuthenticated, isAuthenticationLoading, requireAuth } = useRequireAuth();
  const tripId = isPersistedTripId(params.planId) ? params.planId : null;
  const applyServerSnapshot = useSetAtom(applyPlannerServerSnapshotAtom);
  const blocks = useAtomValue(tripBlocksAtom);
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
      reserveSocPct: 12,
      targetSocPct,
      maximumDetourKm: 20,
    };
  }, [blockId, startingSocPct, targetSocPct, vehicle]);
  const requestKey = payload ? getRequestKey(payload) : null;
  const currentPreview =
    previewState && previewState.key === requestKey ? previewState : null;

  const previewMutation = useMutation({
    mutationFn: async (request: EvOptimizationRequestPayload) => {
      if (!tripId) {
        throw new PlannerApiError(
          "Save this trip before using EV route optimization.",
          400,
        );
      }
      const snapshot = await getPlannerSnapshot(tripId);
      const needsTargets = blocks.some((block) => block.items.some((item) => item.type === "place" && item.evCharger?.targetBatteryPct != null));
      const needsDestinations = blocks.some((block) => block.destination);
      if ((needsTargets && !snapshot.capabilities?.includes("charge-targets")) || (needsDestinations && !snapshot.capabilities?.includes("day-destinations"))) {
        throw new PlannerApiError("Route optimization needs the server update to preserve your destination changes and charging targets. You can continue editing your itinerary.", 409);
      }
      return previewTripEvOptimization(tripId, request);
    },
    onMutate: () => {
      setAppliedMessage(null);
      setPreviewState(null);
    },
    onSuccess: (data, request) => {
      setPreviewState({ data, payload: request, key: getRequestKey(request) });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (state: PreviewState) => {
      if (!tripId || !canAutomaticallyPlan(vehicle)) {
        throw new PlannerApiError(
          "Confirm the vehicle energy selection before applying EV route optimization.",
          400,
        );
      }
      return applyTripEvOptimization(tripId, {
        ...state.payload,
        expectedVersion: state.data.baseVersion,
      });
    },
    onSuccess: (snapshot) => {
      if (!tripId) return;
      applyServerSnapshot({ tripId, ...snapshot });
      setPreviewState(null);
      setAppliedMessage("Optimized charging stops were applied to this day.");
    },
  });

  const canPreview = Boolean(tripId && payload);
  const operations = currentPreview?.data.operations ?? [];
  const canApply = Boolean(
    canAutomaticallyPlan(vehicle) && currentPreview?.data.feasible && operations.length > 0,
  );
  const error = previewMutation.error ?? applyMutation.error;

  function previewRoute() {
    if (!payload || !tripId) return;
    applyMutation.reset();
    previewMutation.mutate(payload);
  }

  function applyPreview() {
    if (!currentPreview || !tripId || !canApply) return;
    applyMutation.mutate(currentPreview);
  }

  return (
    <div className="mt-4 border-t border-primary/15 pt-3">
      <div className="flex items-center gap-2">
        <Route className="size-4 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Optimize the whole EV route
          </p>
          <p className="text-xs text-muted-foreground">
            Checks live chargers and may add, remove, or replace unlocked stops.
          </p>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="mt-3 h-10 w-full rounded-sm"
        disabled={isAuthenticationLoading || (isAuthenticated && !canPreview) || previewMutation.isPending || applyMutation.isPending}
        onClick={() => requireAuth(previewRoute)}
      >
        {previewMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="size-4" aria-hidden="true" />
        )}
        {previewMutation.isPending ? "Checking the route..." : isAuthenticated ? "Optimize EV route" : "Sign in for saved-route optimization"}
      </Button>

      {vehicle && !canAutomaticallyPlan(vehicle) && <p className="mt-2 text-xs text-muted-foreground">Rated-range previews are provisional and cannot apply automatic chargers. Legacy estimates need confirmation in vehicle settings before automatic application.</p>}
      {!vehicle ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Select an EV from your garage first.
        </p>
      ) : !tripId ? (
        <p className="mt-2 text-xs text-muted-foreground">
          This feature updates a saved trip. You can still add charging stops and estimate battery usage in a guest plan.
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {getMutationError(error)}
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
              {operations.map((operation) => (
                <li key={`${operation.type}-${operation.sequence}`}>
                  {describeOperation(operation)}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {currentPreview.data.finalSocPct === null ? "Final battery unavailable" : `Finish at ${currentPreview.data.finalSocPct.toFixed(1)}% battery`}
            {currentPreview.data.totalChargingMinutes > 0
              ? ` · ${currentPreview.data.totalChargingMinutes} min charging`
              : ""}
          </p>
          {currentPreview.data.warnings.map((warning) => (
            <p key={warning} className="mt-1 text-xs text-muted-foreground">
              {warning}
            </p>
          ))}
          {canApply ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full rounded-sm border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              disabled={applyMutation.isPending}
              onClick={applyPreview}
            >
              {applyMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {applyMutation.isPending ? "Applying changes..." : "Apply optimized route"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
