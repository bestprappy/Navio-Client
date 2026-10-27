import { atom } from "jotai";
import type { ReaderModel, ReaderSelection, ReaderAction } from "./reader-model";
import { initialReaderSelection, reduceReaderSelection } from "./reader-model";

export const readerModelAtom = atom<ReaderModel | null>(null);
const selectionAtom = atom<ReaderSelection | null>(null);
export const readerSelectionAtom = atom(get => get(selectionAtom) ?? initialReaderSelection(get(readerModelAtom)?.groups ?? []));
export const readerActionAtom = atom(null, (get, set, action: ReaderAction) => {
  const groups = get(readerModelAtom)?.groups ?? [];
  const next = reduceReaderSelection(get(readerSelectionAtom), action, groups);
  set(selectionAtom, next);
  if (action.type === "select" && groups.some(group => group.id === next.groupId && group.kind === "day")) {
    set(readerSingleDayAtom, next.groupId);
  }
});
export const readerDayModeAtom = atom<"all" | "single">("all");
export const readerSingleDayAtom = atom<string | null>(null);
export const readerFilterMapAtom = atom(false);
