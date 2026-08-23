"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  getPlannerSnapshot,
  isPersistedTripId,
  isPlannerBlocks,
  createTrip,
  PlannerApiError,
  savePlannerSnapshot,
  type PlannerSnapshot,
} from "@/app/feature/planner/_components/planner-api";

import {
  activeBlockIdAtom,
  openBlockIdsAtom,
  tripBlocksAtom,
} from "./trip-builder.atoms";
import type { TripBlockData } from "../constants/types";

const AUTOSAVE_DELAY_MS = 750;
const PLANNER_DRAFT_STORAGE_PREFIX = "navio:planner-draft:v1:";

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

type SyncStatus = "loading" | "saved" | "saving" | "error";

type SaveVariables = {
  blocks: TripBlockData[];
  serialized: string;
};

type PlannerDraft = {
  version: number;
  blocks: TripBlockData[];
  updatedAt: string;
};

export function PlannerPersistence({
  planId,
  destinationId,
  destinationName,
  from,
  to,
  latitude,
  longitude,
  templatePlanId,
}: PlannerPersistenceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const store = useStore();
  const blocks = useAtomValue(tripBlocksAtom);
  const setBlocks = useSetAtom(tripBlocksAtom);
  const setOpenBlockIds = useSetAtom(openBlockIdsAtom);
  const setActiveBlockId = useSetAtom(activeBlockIdAtom);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>();
  const isDraftStoredRef = useRef(false);
  const hydratedPlanIdRef = useRef<string | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const plannerVersionRef = useRef<number | null>(null);
  const latestBlocksRef = useRef(blocks);
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

  const createMissingTripMutation = useMutation({
    mutationFn: createTrip,
    retry: 1,
    onMutate: () => setStatus("loading"),
    onSuccess: (trip) => {
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
    mutationFn: ({ blocks: nextBlocks }: SaveVariables) => {
      const version = plannerVersionRef.current;
      if (version === null) {
        throw new PlannerApiError("Planner version is not loaded yet.", 409);
      }
      return savePlannerSnapshot(persistedPlanId!, nextBlocks, version);
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
      lastSavedRef.current = variables.serialized;
      plannerVersionRef.current = snapshot.version;
      const latestSerialized = serializeBlocks(latestBlocksRef.current);
      queryClient.setQueryData<PlannerSnapshot>(queryKey, (current) =>
        current
          ? {
              blocks: variables.blocks,
              version: snapshot.version,
              savedAt: snapshot.savedAt,
            }
          : current,
      );
      if (latestSerialized === variables.serialized) {
        clearPlannerDraft(persistedPlanId!);
        isDraftStoredRef.current = false;
        setSyncErrorMessage(undefined);
        setStatus("saved");
      } else {
        const stored = writePlannerDraft(
          persistedPlanId!,
          snapshot.version,
          latestBlocksRef.current,
        );
        isDraftStoredRef.current = stored;
        setStatus("saving");
      }
    },
    onError: (error) => {
      console.error("Planner autosave failed.", {
        component: "PlannerPersistence",
        operation: "savePlannerSnapshot",
        planId: persistedPlanId,
        error,
      });
      setSyncErrorMessage(
        isDraftStoredRef.current
          ? "Changes are stored on this device. Sync failed."
          : "Changes could not be saved. Keep this page open and retry.",
      );
      setStatus("error");
    },
  });
  const saveBlocks = saveMutation.mutate;

  const persistMissingTrip = useCallback(() => {
    if (!planId) return;

    const today = formatDate(new Date());
    createMissingTrip({
      displayName: `Trip to ${destinationName}`,
      startDate: toDateOnly(from) ?? today,
      endDate: toDateOnly(to) ?? toDateOnly(from) ?? today,
      destinationId: destinationId ?? templatePlanId ?? planId,
      destinationName,
      destinationLat: latitude,
      destinationLng: longitude,
    });
  }, [
    createMissingTrip,
    destinationId,
    destinationName,
    from,
    latitude,
    longitude,
    planId,
    templatePlanId,
    to,
  ]);

  useEffect(() => {
    hydratedPlanIdRef.current = null;
    lastSavedRef.current = null;
    plannerVersionRef.current = null;
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
    if (hydratedPlanIdRef.current === persistedPlanId) return;

    const serverBlocks = plannerQuery.data.blocks;
    const serverSerialized = serializeBlocks(serverBlocks);
    const draft = readPlannerDraft(persistedPlanId);
    const recoverableDraft =
      draft &&
      draft.version === plannerQuery.data.version &&
      serializeBlocks(draft.blocks) !== serverSerialized
        ? draft
        : null;
    const currentBlocks = store.get(tripBlocksAtom);
    const shouldUseServerBlocks =
      !recoverableDraft &&
      (serverBlocks.length > 0 || currentBlocks.length === 0);
    skipAutosaveOnceRef.current = shouldUseServerBlocks;
    const hydratedBlocks = recoverableDraft?.blocks ?? serverBlocks;
    if (recoverableDraft || shouldUseServerBlocks) {
      setBlocks(hydratedBlocks);
      setOpenBlockIds(hydratedBlocks.map((block) => block.id));
      setActiveBlockId(hydratedBlocks[0]?.id ?? null);
      latestBlocksRef.current = hydratedBlocks;
    } else {
      latestBlocksRef.current = currentBlocks;
    }

    if (draft && !recoverableDraft && serializeBlocks(draft.blocks) === serverSerialized) {
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
    plannerQuery.data,
    setActiveBlockId,
    setBlocks,
    setOpenBlockIds,
    store,
  ]);

  useEffect(() => {
    latestBlocksRef.current = blocks;
    if (!persistedPlanId || hydratedPlanIdRef.current !== persistedPlanId) {
      return;
    }
    if (skipAutosaveOnceRef.current) {
      skipAutosaveOnceRef.current = false;
      return;
    }

    const serialized = serializeBlocks(blocks);
    if (serialized === lastSavedRef.current) {
      clearPlannerDraft(persistedPlanId);
      isDraftStoredRef.current = false;
      return;
    }

    const version = plannerVersionRef.current;
    if (version !== null) {
      isDraftStoredRef.current = writePlannerDraft(persistedPlanId, version, blocks);
    }

    const statusTimeoutId = window.setTimeout(() => setStatus("saving"), 0);
    const saveTimeoutId = window.setTimeout(() => {
      saveBlocks({ blocks, serialized });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(statusTimeoutId);
      window.clearTimeout(saveTimeoutId);
    };
  }, [blocks, persistedPlanId, plannerQuery.isSuccess, saveBlocks]);

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
        const nextBlocks = latestBlocksRef.current;
        saveBlocks({
          blocks: nextBlocks,
          serialized: serializeBlocks(nextBlocks),
        });
      });
      return;
    }
    if (hydratedPlanIdRef.current !== persistedPlanId) {
      void plannerQuery.refetch();
      return;
    }
    const nextBlocks = latestBlocksRef.current;
    saveBlocks({
      blocks: nextBlocks,
      serialized: serializeBlocks(nextBlocks),
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
  const content = {
    loading: {
      icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
      label: "Loading trip…",
    },
    saving: {
      icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
      label: "Saving changes…",
    },
    saved: {
      icon: <Check className="size-3.5" aria-hidden="true" />,
      label: "All changes saved",
    },
    error: {
      icon: <CloudOff className="size-3.5" aria-hidden="true" />,
      label: message ?? "Changes are kept locally. Sync failed.",
    },
  }[status];

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex max-w-sm items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-md"
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

function serializeBlocks(blocks: TripBlockData[]): string {
  return JSON.stringify(blocks);
}

function readPlannerDraft(planId: string): PlannerDraft | null {
  try {
    const rawDraft = window.localStorage.getItem(plannerDraftStorageKey(planId));
    if (!rawDraft) return null;

    const value: unknown = JSON.parse(rawDraft);
    if (
      !value ||
      typeof value !== "object" ||
      !("version" in value) ||
      typeof value.version !== "number" ||
      !("blocks" in value) ||
      !isPlannerBlocks(value.blocks) ||
      !("updatedAt" in value) ||
      typeof value.updatedAt !== "string"
    ) {
      clearPlannerDraft(planId);
      return null;
    }
    return {
      version: value.version,
      blocks: value.blocks,
      updatedAt: value.updatedAt,
    };
  } catch (error) {
    console.warn("Planner draft could not be read.", { planId, error });
    return null;
  }
}

function writePlannerDraft(
  planId: string,
  version: number,
  blocks: TripBlockData[],
): boolean {
  try {
    const draft: PlannerDraft = {
      version,
      blocks,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(plannerDraftStorageKey(planId), JSON.stringify(draft));
    return true;
  } catch (error) {
    console.warn("Planner draft could not be stored.", { planId, error });
    return false;
  }
}

function clearPlannerDraft(planId: string): void {
  try {
    window.localStorage.removeItem(plannerDraftStorageKey(planId));
  } catch (error) {
    console.warn("Planner draft could not be cleared.", { planId, error });
  }
}

function plannerDraftStorageKey(planId: string): string {
  return `${PLANNER_DRAFT_STORAGE_PREFIX}${planId}`;
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
