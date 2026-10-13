import { atom } from "jotai";
import type { Editor } from "@tiptap/core";

import type { Guide } from "./guide-model";
import type { PlaceSearchResult } from "../../../planner/planId/_components/constants/types";

/**
 * The guides open in the editor, as this admin is changing them. The server
 * copy lives in TanStack Query; a draft is saved back to it by the editor's
 * autosave, which names the version the draft started from.
 */
export const guideDraftsAtom = atom<Readonly<Record<string, Guide>>>({});

/** How many edits each draft has had; autosave saves when this moves past what it last sent. */
export const guideEditCountsAtom = atom<Readonly<Record<string, number>>>({});
export const guideSavedCountsAtom = atom<Readonly<Record<string, number>>>({});

/** Changes one open guide and counts the edit for autosave. */
export const updateGuideAtom = atom(null, (get, set, { guideId, update }: { guideId: string; update: (guide: Guide) => Guide }) => {
  const draft = get(guideDraftsAtom)[guideId];
  if (!draft) return;
  const next = update(draft);
  if (next === draft) return;
  set(guideDraftsAtom, { ...get(guideDraftsAtom), [guideId]: next });
  set(guideEditCountsAtom, { ...get(guideEditCountsAtom), [guideId]: (get(guideEditCountsAtom)[guideId] ?? 0) + 1 });
});

/** Puts the server's copy in place as the draft, discarding unsaved edits; used on open and after a conflict. */
export const loadGuideDraftAtom = atom(null, (get, set, guide: Guide) => {
  set(guideDraftsAtom, { ...get(guideDraftsAtom), [guide.id]: guide });
  set(guideSavedCountsAtom, { ...get(guideSavedCountsAtom), [guide.id]: get(guideEditCountsAtom)[guide.id] ?? 0 });
});

/** Records what a save returned without touching edits made while it was in flight. */
export const acceptSavedGuideAtom = atom(null, (get, set, saved: Guide) => {
  const draft = get(guideDraftsAtom)[saved.id];
  if (!draft) return;
  set(guideDraftsAtom, {
    ...get(guideDraftsAtom),
    [saved.id]: { ...draft, version: saved.version, status: saved.status, publishedAt: saved.publishedAt, updatedByName: saved.updatedByName, updatedAt: saved.updatedAt },
  });
});

export const closeGuideDraftAtom = atom(null, (get, set, guideId: string) => {
  const drafts = { ...get(guideDraftsAtom) };
  const counts = { ...get(guideEditCountsAtom) };
  delete drafts[guideId];
  delete counts[guideId];
  set(guideDraftsAtom, drafts);
  set(guideEditCountsAtom, counts);
});

function randomSuffix(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

export function createListId(): string {
  return `list-${randomSuffix()}`;
}

// ---------------------------------------------------------------- editor UI state

/**
 * The place picked in the text or on the map, by its card's key. The map
 * always follows it; the text scrolls to it only when it was picked on the map.
 */
export const selectedGuidePlaceAtom = atom<{ key: string; from: "text" | "map" } | null>(null);

/** The guide's text editor, so the map can add a found place to the text. */
export const guideTextEditorAtom = atom<Editor | null>(null);

/**
 * A place found by a list's search or clicked on the map, previewed until it
 * is added or dismissed. `listId` is the section it would join.
 */
export const guidePlaceCandidateAtom = atom<{ listId: string | null; place: PlaceSearchResult; from: "search" | "map" } | null>(null);

/** The section last worked in; places clicked on the map are offered to it. */
export const activeGuideListAtom = atom<string | null>(null);

/** A list block just inserted from the slash menu; its search takes focus once. */
export const focusListSearchAtom = atom<string | null>(null);
