"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { readPlannerDraft, writePlannerDraft, clearPlannerDraft } from "@/app/feature/planner/_components/planner-draft";
import { useTripMetadata } from "@/app/feature/planner/_components/use-trip-metadata";
import { ensureItineraryDays } from "../itinerary/itinerary-days";
import { tripMetadataPlannerVersionAtom } from "@/app/feature/planner/_components/trip-metadata-sync.atoms";
import {
  getPlannerSnapshot,
  isPersistedTripId,
  createTrip,
  PlannerApiError,
  savePlannerSnapshot,
  type CreateTripPayload,
  type PlannerSnapshot,
} from "@/app/feature/planner/_components/planner-api";
import { resolveDestinationPlaceId } from "@/app/feature/planner/_components/destination-api";

import {
  activeBlockIdAtom,
  openBlockIdsAtom,
  plannerServerSnapshotUpdateAtom,
  tripBudgetAtom,
  tripBlocksAtom,
  tripCurrencyAtom,
  tripExpensesAtom,
} from "./trip-builder.atoms";
import {
  getCurrencyOption,
} from "../budget/budget.data";
import type { TripBudgetState } from "../budget/budget.types";
import type { TripBlockData } from "../constants/types";

const AUTOSAVE_DELAY_MS = 750;

type PlannerPersistenceProps = {
  planId?: string;
  destinationId?: string;
  destinationName: string;
  from?: string;
  to?: string;
  latitude: number;
  longitude: number;
  templatePlanId?: string;
};

type SyncStatus = "loading" | "saved" | "saved-local" | "saving" | "error";

type MissingTripRequest = Omit<CreateTripPayload, "destinationId"> & {
  destinationId?: string;
  destinationName: string;
};

type SaveVariables = {
  state: PlannerState;
  serialized: string;
};

type PlannerState = {
  blocks: TripBlockData[];
  budget: TripBudgetState;
};


export function PlannerPersistence({
  planId,
  destinationId,
  destinationName,
  from,
  to,
  templatePlanId,
}: PlannerPersistenceProps) {
  const router = useRouter();
  const metadata = useTripMetadata(planId);
  const queryClient = useQueryClient();
  const store = useStore();
  const blocks = useAtomValue(tripBlocksAtom);
  const currency = useAtomValue(tripCurrencyAtom);
  const budgetAmount = useAtomValue(tripBudgetAtom);
  const expenses = useAtomValue(tripExpensesAtom);
  const serverSnapshotUpdate = useAtomValue(plannerServerSnapshotUpdateAtom);
  const setBlocks = useSetAtom(tripBlocksAtom);
  const setCurrency = useSetAtom(tripCurrencyAtom);
  const setBudgetAmount = useSetAtom(tripBudgetAtom);
  const setExpenses = useSetAtom(tripExpensesAtom);
  const setOpenBlockIds = useSetAtom(openBlockIdsAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const setServerSnapshotUpdate = useSetAtom(
    plannerServerSnapshotUpdateAtom,
  );
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>();
  const [hydrationRequest, setHydrationRequest] = useState(0);
  const isDraftStoredRef = useRef(false);
  const localSettingsPendingRef = useRef(false);
  const hydratedPlanIdRef = useRef<string | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const plannerVersionRef = useRef<number | null>(null);
  const plannerState = useMemo<PlannerState>(
    () => ({
      blocks,
      budget: {
        currency: currency.code,
        amount: budgetAmount,
        expenses,
      },
    }),
    [blocks, budgetAmount, currency.code, expenses],
  );
  const latestStateRef = useRef(plannerState);
  const skipAutosaveOnceRef = useRef(false);
  const creationAttemptRef = useRef<string | null>(null);
  const persistedPlanId = isPersistedTripId(planId) ? planId : null;
  const queryKey = ["planner", persistedPlanId] as const;

  const plannerQuery = useQuery({
    queryKey,
    queryFn: () => getPlannerSnapshot(persistedPlanId!),
    enabled: persistedPlanId !== null,
    retry: (failureCount, error) =>
      failureCount < 2 &&
      (!(error instanceof PlannerApiError) ||
        error.status === 0 ||
        error.status >= 500),
    staleTime: 30_000,
  });
  const serverBlockCount = plannerQuery.data?.blocks.length ?? 0;

  const createMissingTripMutation = useMutation({
    mutationFn: async ({ destinationName: name, ...payload }: MissingTripRequest) =>
      createTrip({
        ...payload,
        destinationId: payload.destinationId ?? await resolveDestinationPlaceId(name),
      }),
    retry: 1,
    onMutate: () => setStatus("loading"),
    onSuccess: (trip) => {
      void queryClient.invalidateQueries({ queryKey: ["planner", "trips"] });
      router.replace(`/planner/${trip.id}${window.location.search}`);
    },
    onError: (error) => {
      console.error("Planner could not create a persisted trip.", {
        component: "PlannerPersistence",
        operation: "createMissingTrip",
        planId,
        error,
      });
      setStatus("error");
    },
  });
  const createMissingTrip = createMissingTripMutation.mutate;

  const saveMutation = useMutation({
    mutationFn: async ({ state }: SaveVariables) => {
      let version = plannerVersionRef.current;
      const metadataVersion = store.get(tripMetadataPlannerVersionAtom);
      if (metadataVersion?.tripId === persistedPlanId) {
        const refreshedVersion = metadataVersion.version ??
          (await getPlannerSnapshot(persistedPlanId!)).version;
        version = Math.max(version ?? 0, refreshedVersion);
        plannerVersionRef.current = version;
        isDraftStoredRef.current = writePlannerDraft(persistedPlanId!, version, latestStateRef.current);
        store.set(tripMetadataPlannerVersionAtom, {
          tripId: persistedPlanId!,
          version: refreshedVersion,
        });
      }
      if (version === null) {
        throw new PlannerApiError("Planner version is not loaded yet.", 409);
      }
      return savePlannerSnapshot(
        persistedPlanId!,
        state.blocks,
        state.budget,
        version,
      );
    },
    scope: { id: persistedPlanId ? `planner-autosave-${persistedPlanId}` : "planner-autosave" },
    retry: (failureCount, error) =>
      failureCount < 2 &&
      (!(error instanceof PlannerApiError) ||
        error.status === 0 ||
        error.status >= 500),
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
    onMutate: () => {
      setSyncErrorMessage(undefined);
      setStatus("saving");
    },
    onSuccess: (snapshot, variables) => {
      localSettingsPendingRef.current = Boolean(snapshot.localOnlySettings);
      void queryClient.invalidateQueries({ queryKey: ["planner", "snapshot-stats", persistedPlanId] });
      lastSavedRef.current = variables.serialized;
      plannerVersionRef.current = snapshot.version;
      const latestSerialized = serializePlannerState(latestStateRef.current);
      queryClient.setQueryData<PlannerSnapshot>(queryKey, (current) =>
        current
          ? {
              blocks: snapshot.syncedBlocks ?? variables.state.blocks,
              budget: variables.state.budget,
              version: snapshot.version,
              savedAt: snapshot.savedAt,
            }
          : current,
      );
      if (latestSerialized === variables.serialized) {
        if (snapshot.localOnlySettings) {
          isDraftStoredRef.current = writePlannerDraft(persistedPlanId!, snapshot.version, latestStateRef.current);
        } else {
          clearPlannerDraft(persistedPlanId!);
          isDraftStoredRef.current = false;
        }
        setSyncErrorMessage(undefined);
        if (snapshot.localOnlySettings && !isDraftStoredRef.current) {
          setSyncErrorMessage("Itinerary saved, but extra settings could not be stored on this device. Keep this page open and enable browser storage.");
          setStatus("error");
        } else setStatus(snapshot.localOnlySettings ? "saved-local" : "saved");
      } else {
        const stored = writePlannerDraft(
          persistedPlanId!,
          snapshot.version,
          latestStateRef.current,
        );
        isDraftStoredRef.current = stored;
        setStatus("saving");
      }
    },
    onError: (error) => {
      console.warn("Planner autosave failed.", {
        component: "PlannerPersistence",
        operation: "savePlannerSnapshot",
        planId: persistedPlanId,
        error,
        message: error instanceof Error ? error.message : String(error),
        status: error instanceof PlannerApiError ? error.status : undefined,
      });
      setSyncErrorMessage(
        error instanceof PlannerApiError && error.message.startsWith("These new planner settings") && isDraftStoredRef.current
          ? error.message
          : isDraftStoredRef.current
          ? "Changes are stored on this device. Sync failed."
          : "Changes could not be saved. Keep this page open and retry.",
      );
      setStatus("error");
    },
  });
  const saveState = saveMutation.mutate;

  const persistMissingTrip = useCallback(() => {
    if (!planId) return;

    const today = formatDate(new Date());
    createMissingTrip({
      startDate: toDateOnly(from) ?? today,
      endDate: toDateOnly(to) ?? toDateOnly(from) ?? today,
      destinationId,
      destinationName,
    });
  }, [
    createMissingTrip,
    destinationId,
    destinationName,
    from,
    planId,
    to,
  ]);

  useEffect(() => {
    hydratedPlanIdRef.current = null;
    lastSavedRef.current = null;
    plannerVersionRef.current = null;
    localSettingsPendingRef.current = false;
    isDraftStoredRef.current = false;
    const timeoutId = window.setTimeout(
      () => {
        setSyncErrorMessage(undefined);
        setStatus(persistedPlanId || planId ? "loading" : "error");
      },
      0,
    );
    return () => window.clearTimeout(timeoutId);
  }, [persistedPlanId, planId]);

  useEffect(() => {
    const tripIsMissing =
      plannerQuery.error instanceof PlannerApiError &&
      plannerQuery.error.status === 404;
    if (
      (persistedPlanId && !tripIsMissing) ||
      !planId ||
      createMissingTripMutation.isPending ||
      createMissingTripMutation.isSuccess
    ) {
      return;
    }

    const creationKey = `${planId}:${templatePlanId ?? "new"}`;
    if (creationAttemptRef.current === creationKey) return;
    creationAttemptRef.current = creationKey;

    persistMissingTrip();
  }, [
    createMissingTripMutation.isPending,
    createMissingTripMutation.isSuccess,
    persistedPlanId,
    planId,
    plannerQuery.error,
    persistMissingTrip,
    templatePlanId,
  ]);

  useEffect(() => {
    if (!persistedPlanId || !plannerQuery.data) return;
    if (!from && metadata.isPending) return;
    if (hydratedPlanIdRef.current === persistedPlanId) return;

    const serverState: PlannerState = {
      blocks: plannerQuery.data.blocks,
      budget: plannerQuery.data.budget,
    };
    const serverSerialized = serializePlannerState(serverState);
    const draft = readPlannerDraft(persistedPlanId);
    const recoverableDraft =
      draft &&
      draft.version === plannerQuery.data.version &&
      serializePlannerState(draft) !== serverSerialized
        ? draft
        : null;
    const currentBlocks = store.get(tripBlocksAtom);
    const shouldUseServerBlocks =
      !recoverableDraft &&
      (serverState.blocks.length > 0 || currentBlocks.length === 0);
    const hydratedState: PlannerState = recoverableDraft
      ? { blocks: recoverableDraft.blocks, budget: recoverableDraft.budget }
      : {
          blocks: shouldUseServerBlocks ? serverState.blocks : currentBlocks,
          budget: serverState.budget,
        };
    hydratedState.blocks = ensureItineraryDays(hydratedState.blocks, metadata.data?.startDate || from, metadata.data?.endDate || to);
    skipAutosaveOnceRef.current = !recoverableDraft && serializePlannerState(hydratedState) === serverSerialized;
    const hydratedBlocks = hydratedState.blocks;
    if (recoverableDraft || shouldUseServerBlocks || hydratedBlocks !== currentBlocks) {
      setBlocks(hydratedBlocks);
      setOpenBlockIds(hydratedBlocks.map((block) => block.id));
      setActiveBlockId(hydratedBlocks[0]?.id ?? null);
    }
    setCurrency(getCurrencyOption(hydratedState.budget.currency));
    setBudgetAmount(hydratedState.budget.amount);
    setExpenses(hydratedState.budget.expenses);
    latestStateRef.current = hydratedState;

    if (
      draft &&
      !recoverableDraft &&
      serializePlannerState(draft) === serverSerialized
    ) {
      clearPlannerDraft(persistedPlanId);
    }
    isDraftStoredRef.current = Boolean(recoverableDraft);
    lastSavedRef.current = serverSerialized;
    plannerVersionRef.current = plannerQuery.data.version;
    hydratedPlanIdRef.current = persistedPlanId;
    const timeoutId = window.setTimeout(() => setStatus("saved"), 0);
    return () => window.clearTimeout(timeoutId);
  }, [
    persistedPlanId,
    from,
    to,
    metadata.data?.startDate,
    metadata.data?.endDate,
    metadata.isPending,
    plannerQuery.data,
    hydrationRequest,
    setActiveBlockId,
    setBudgetAmount,
    setBlocks,
    setCurrency,
    setExpenses,
    setOpenBlockIds,
    store,
  ]);

  useEffect(() => {
    if (
      !persistedPlanId ||
      !serverSnapshotUpdate ||
      serverSnapshotUpdate.tripId !== persistedPlanId
    ) {
      return;
    }

    const serverState: PlannerState = {
      blocks: serverSnapshotUpdate.blocks,
      budget: serverSnapshotUpdate.budget,
    };
    const serialized = serializePlannerState(serverState);
    skipAutosaveOnceRef.current = true;
    latestStateRef.current = serverState;
    lastSavedRef.current = serialized;
    plannerVersionRef.current = serverSnapshotUpdate.version;
    hydratedPlanIdRef.current = persistedPlanId;
    clearPlannerDraft(persistedPlanId);
    isDraftStoredRef.current = false;
    queryClient.setQueryData<PlannerSnapshot>(
      ["planner", persistedPlanId] as const,
      {
        blocks: serverSnapshotUpdate.blocks,
        budget: serverSnapshotUpdate.budget,
        version: serverSnapshotUpdate.version,
        savedAt: serverSnapshotUpdate.savedAt,
      },
    );
    const timeoutId = window.setTimeout(() => {
      setSyncErrorMessage(undefined);
      setStatus("saved");
      setServerSnapshotUpdate(null);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [
    persistedPlanId,
    queryClient,
    serverSnapshotUpdate,
    setServerSnapshotUpdate,
  ]);

  useEffect(() => {
    latestStateRef.current = plannerState;
    if (!persistedPlanId || hydratedPlanIdRef.current !== persistedPlanId) {
      return;
    }
    // A hydrated trip always has its days, so an empty itinerary here means the
    // planner store was reset underneath us (dev hot reload re-creating the
    // atoms, or a template reset). Saving it would wipe the trip on the server
    // and in the local draft, so reload the last saved snapshot instead.
    if (plannerState.blocks.length === 0 && serverBlockCount > 0) {
      console.warn("Planner state was reset after hydration; restoring the saved trip instead of autosaving it.", {
        component: "PlannerPersistence",
        operation: "autosave",
        planId: persistedPlanId,
      });
      hydratedPlanIdRef.current = null;
      window.setTimeout(() => setHydrationRequest((request) => request + 1), 0);
      return;
    }
    if (skipAutosaveOnceRef.current) {
      skipAutosaveOnceRef.current = false;
      return;
    }

    const serialized = serializePlannerState(plannerState);
    if (serialized === lastSavedRef.current) {
      if (!localSettingsPendingRef.current) {
        clearPlannerDraft(persistedPlanId);
        isDraftStoredRef.current = false;
      }
      return;
    }

    const version = plannerVersionRef.current;
    if (version !== null) {
      isDraftStoredRef.current = writePlannerDraft(
        persistedPlanId,
        version,
        plannerState,
      );
    }

    const statusTimeoutId = window.setTimeout(() => setStatus("saving"), 0);
    const saveTimeoutId = window.setTimeout(() => {
      saveState({ state: plannerState, serialized });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(statusTimeoutId);
      window.clearTimeout(saveTimeoutId);
    };
  }, [persistedPlanId, plannerQuery.isSuccess, plannerState, saveState, serverBlockCount]);

  useEffect(() => {
    const tripIsMissing =
      plannerQuery.error instanceof PlannerApiError &&
      plannerQuery.error.status === 404;
    if (plannerQuery.isError && !tripIsMissing) {
      console.error("Planner hydration failed.", {
        component: "PlannerPersistence",
        operation: "getPlannerSnapshot",
        planId: persistedPlanId,
        error: plannerQuery.error,
      });
      const timeoutId = window.setTimeout(() => {
        setSyncErrorMessage("The saved trip could not be loaded. Please retry.");
        setStatus("error");
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [persistedPlanId, plannerQuery.error, plannerQuery.isError]);

  function retrySync() {
    const tripIsMissing =
      plannerQuery.error instanceof PlannerApiError &&
      plannerQuery.error.status === 404;
    if (!persistedPlanId || tripIsMissing) {
      creationAttemptRef.current = null;
      persistMissingTrip();
      return;
    }
    const versionConflict =
      saveMutation.error instanceof PlannerApiError &&
      saveMutation.error.status === 409;
    if (versionConflict) {
      setStatus("loading");
      void plannerQuery.refetch().then((result) => {
        if (!result.data) {
          setStatus("error");
          return;
        }
        plannerVersionRef.current = result.data.version;
        const nextState = latestStateRef.current;
        saveState({
          state: nextState,
          serialized: serializePlannerState(nextState),
        });
      });
      return;
    }
    if (hydratedPlanIdRef.current !== persistedPlanId) {
      void plannerQuery.refetch();
      return;
    }
    const nextState = latestStateRef.current;
    saveState({
      state: nextState,
      serialized: serializePlannerState(nextState),
    });
  }

  if (!persistedPlanId) {
    return (
      <PlannerSyncStatus
        status={status}
        message="This plan could not be connected to the trip service."
        onRetry={status === "error" && planId ? retrySync : undefined}
      />
    );
  }

  return (
    <PlannerSyncStatus
      status={status}
      message={status === "error" ? syncErrorMessage : undefined}
      onRetry={status === "error" ? retrySync : undefined}
    />
  );
}

function PlannerSyncStatus({
  status,
  message,
  onRetry,
}: {
  status: SyncStatus;
  message?: string;
  onRetry?: () => void;
}) {
  // The resting "saved" state stays silent; only in-flight and failed syncs surface.
  if (status === "saved") return null;

  const content = {
    "saved-local": {
      icon: <CloudOff className="size-3.5 shrink-0" aria-hidden="true" />,
      label: "Itinerary saved. Destination changes and charge targets are stored on this device until the server update.",
    },
    loading: {
      icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
      label: "Loading trip…",
    },
    saving: {
      icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
      label: "Saving changes…",
    },
    error: {
      icon: <CloudOff className="size-3.5" aria-hidden="true" />,
      label: message ?? "Changes are kept locally. Sync failed.",
    },
  }[status];

  return (
    <div
      className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground shadow-sm"
      role="status"
      aria-live="polite"
    >
      {content.icon}
      <span>{content.label}</span>
      {onRetry ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 rounded-full px-2 text-xs"
          onClick={onRetry}
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

function serializePlannerState(state: PlannerState): string {
  return JSON.stringify({ blocks: state.blocks, budget: state.budget });
}

function toDateOnly(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : formatDate(parsed);
}

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
