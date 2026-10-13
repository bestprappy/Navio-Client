"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useStore } from "jotai";

import type { Guide } from "../guide-model";
import { GuideApiError } from "../guides-api";
import { acceptSavedGuideAtom, guideDraftsAtom, guideEditCountsAtom, guideSavedCountsAtom } from "../guides.atoms";

import { adminGuideWorkspace, type GuideWorkspace } from "../guide-workspace";

const AUTOSAVE_DELAY_MS = 1200;

export type GuideSaveStatus =
  | { kind: "saved" }
  | { kind: "pending" }
  | { kind: "saving" }
  /** The save failed but can be tried again; edits are kept. */
  | { kind: "error"; message: string }
  /** Another admin saved first; saving stops until this admin reloads their copy. */
  | { kind: "conflict"; message: string }
  /** The guide was deleted elsewhere. */
  | { kind: "gone"; message: string };

type Failure = Extract<GuideSaveStatus, { kind: "error" | "conflict" | "gone" }>;

/**
 * Saves the open guide shortly after each pause in editing. Saves never
 * overlap; edits made during a save are sent by the next one. A conflict
 * stops saving, so another admin's work is never overwritten.
 */
export function useGuideAutosave(guideId: string, workspace: GuideWorkspace = adminGuideWorkspace) {
  const store = useStore();
  const queryClient = useQueryClient();
  const editCount = useAtomValue(guideEditCountsAtom)[guideId] ?? 0;
  const [savedCount, setSavedCount] = useState(() => store.get(guideSavedCountsAtom)[guideId] ?? 0);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const savedCountRef = useRef(savedCount);
  const inFlight = useRef<Promise<Guide | null> | null>(null);
  const blocked = failure?.kind === "conflict" || failure?.kind === "gone";
  const blockedRef = useRef(false);
  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);

  const flush = useCallback(async function saveUntilCurrent(): Promise<Guide | null> {
    if (blockedRef.current) return null;
    while (inFlight.current) await inFlight.current;
    if (blockedRef.current) return null;
    const count = store.get(guideEditCountsAtom)[guideId] ?? 0;
    const draft = store.get(guideDraftsAtom)[guideId];
    if (!draft) return null;
    if (count <= savedCountRef.current) return draft;

    setSaving(true);
    const run = workspace.save(draft)
      .then((saved) => {
        store.set(acceptSavedGuideAtom, saved);
        savedCountRef.current = count;
        setSavedCount(count);
        store.set(guideSavedCountsAtom, { ...store.get(guideSavedCountsAtom), [guideId]: count });
        setFailure(null);
        void queryClient.invalidateQueries({ queryKey: workspace.keys.list });
        if (saved.status === "PUBLISHED") void queryClient.invalidateQueries({ queryKey: workspace.keys.published });
        return store.get(guideDraftsAtom)[guideId] ?? saved;
      })
      .catch((error: unknown) => {
        console.error("Guide autosave failed.", { component: "GuideEditor", operation: "saveGuide", guideId, error });
        const message = error instanceof GuideApiError ? error.message : "The guide could not be saved. Your changes are kept here.";
        if (error instanceof GuideApiError && error.kind === "conflict") {
          blockedRef.current = true;
          setFailure({ kind: "conflict", message: "This guide was saved in another session while you were editing. Reload to see their version; your unsaved changes here will be replaced." });
        } else if (error instanceof GuideApiError && error.kind === "notFound") {
          blockedRef.current = true;
          setFailure({ kind: "gone", message });
        } else {
          setFailure({ kind: "error", message });
        }
        return null;
      })
      .finally(() => {
        inFlight.current = null;
        setSaving(false);
      });
    inFlight.current = run;
    const result = await run;
    // Publication/navigation must include text typed while the previous save was in flight.
    if (result && (store.get(guideEditCountsAtom)[guideId] ?? 0) > savedCountRef.current) return saveUntilCurrent();
    return result;
  }, [guideId, queryClient, store, workspace]);

  // Save a moment after the last edit.
  useEffect(() => {
    if (blocked || editCount <= savedCount) return;
    const timer = window.setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [blocked, editCount, flush, savedCount]);

  const unsaved = editCount > savedCount;

  // Leaving the page with unsaved changes asks first.
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  // Leaving the editor inside the app sends the last edits on the way out.
  const unsavedRef = useRef(false);
  useEffect(() => {
    unsavedRef.current = unsaved;
  }, [saving, unsaved]);
  useEffect(() => {
    return () => {
      const draft = store.get(guideDraftsAtom)[guideId];
      if (!draft || !unsavedRef.current || blockedRef.current) return;
      void flush();
    };
  }, [flush, guideId, store]);

  /** After the draft is replaced with the server's copy, nothing is unsaved. */
  const reset = useCallback(() => {
    const count = store.get(guideEditCountsAtom)[guideId] ?? 0;
    savedCountRef.current = count;
    setSavedCount(count);
    setFailure(null);
    blockedRef.current = false;
  }, [guideId, store]);

  const status: GuideSaveStatus = failure && failure.kind !== "error"
    ? failure
    : saving
      ? { kind: "saving" }
      : failure
        ? failure
        : unsaved
          ? { kind: "pending" }
          : { kind: "saved" };

  return { status, flush, reset };
}
