"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWatch, type FieldValues, type UseFormReturn } from "react-hook-form";

import type { ProfileSaveStatus } from "@/types/profile";

const AUTOSAVE_DELAY_MS = 750;

type ProfileAutosaveOptions<TValues extends FieldValues> = {
  form: UseFormReturn<TValues>;
  /** The last values known to be stored on the server. */
  baseline: TValues;
  /** Persists the change. Receives the baseline so it can send a minimal patch. */
  save: (values: TValues, baseline: TValues) => Promise<unknown>;
  /** Serialises concurrent saves that touch the same resource. */
  scopeId: string;
  enabled?: boolean;
};

type ProfileAutosave<TValues extends FieldValues> = {
  status: ProfileSaveStatus;
  isSaving: boolean;
  error: string | null;
  retry: () => void;
  /** Adopts server-confirmed values without marking the form dirty. */
  syncBaseline: (values: TValues) => void;
};

/**
 * Debounced autosave for a react-hook-form form.
 *
 * A save runs only when the form is valid, the values still match what was
 * scheduled, and no other save is in flight. A failed save is not retried
 * automatically, because retrying a rejected payload on a timer just repeats
 * the rejection — the user gets an explicit Retry instead.
 */
export function useProfileAutosave<TValues extends FieldValues>({
  form,
  baseline,
  save,
  scopeId,
  enabled = true,
}: ProfileAutosaveOptions<TValues>): ProfileAutosave<TValues> {
  // Subscribed for the re-render only; the snapshot itself is read through
  // getValues so every comparison below comes from the same source and key
  // order, which a mix of watched and read values would not guarantee.
  useWatch({ control: form.control });
  const snapshot = JSON.stringify(form.getValues());
  const [savedValues, setSavedValues] = useState<TValues>(baseline);
  const [hasSaved, setHasSaved] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const activeSave = useRef(false);

  // The baseline travels with the mutation rather than through a ref, so the
  // patch is always diffed against what was stored when the save was scheduled.
  const mutation = useMutation({
    mutationFn: ({ next, from }: { next: TValues; from: TValues; snapshot: string }) =>
      save(next, from),
    scope: { id: scopeId },
    retry: false,
    onSuccess: (_result, submitted) => {
      setSavedValues(submitted.next);
      setHasSaved(true);
    },
  });

  const { mutate, isPending, isError, error, variables, reset: resetMutation } = mutation;
  const savedSnapshot = JSON.stringify(savedValues);
  const dirty = snapshot !== savedSnapshot;
  const failedCurrent = isError && variables?.snapshot === snapshot;
  const { getValues, trigger } = form;

  useEffect(() => {
    if (!enabled || !dirty || isPending || failedCurrent) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const valid = await trigger();
      const next = getValues();
      // Validation awaits, so a keystroke can land in between. That keystroke
      // re-runs this effect and schedules its own save, making this one stale.
      if (cancelled || !valid || activeSave.current) return;
      if (JSON.stringify(next) !== snapshot) return;

      activeSave.current = true;
      mutate(
        { next, from: savedValues, snapshot },
        { onSettled: () => { activeSave.current = false; } },
      );
    }, AUTOSAVE_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    dirty,
    enabled,
    failedCurrent,
    getValues,
    isPending,
    mutate,
    retryCount,
    savedValues,
    snapshot,
    trigger,
  ]);

  useEffect(() => {
    if (!dirty && !isPending) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty, isPending]);

  const syncBaseline = useCallback(
    (next: TValues) => {
      form.reset(next);
      setSavedValues(next);
      setHasSaved(false);
      resetMutation();
    },
    [form, resetMutation],
  );

  const retry = useCallback(() => {
    resetMutation();
    setRetryCount((count) => count + 1);
  }, [resetMutation]);

  const status: ProfileSaveStatus = isPending
    ? "saving"
    : failedCurrent
      ? "error"
      : dirty
        ? "dirty"
        : hasSaved
          ? "saved"
          : "idle";

  return {
    status,
    isSaving: isPending,
    error: failedCurrent && error instanceof Error ? error.message : null,
    retry,
    syncBaseline,
  };
}
