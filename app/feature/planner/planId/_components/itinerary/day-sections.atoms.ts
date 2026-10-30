import { atom } from "jotai";

import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { getSectionIdOfItem, getSectionItemIds, type CollapsedSections } from "./day-sections";

/**
 * Sections folded away in this session, each with the items it held when folded.
 * Anything added to a folded section afterwards stays visible, so a new stop
 * never disappears. View state only: it is not saved with the trip.
 */
export const collapsedSectionsAtom = atom<CollapsedSections>(new Map());

export const toggleSectionCollapsedAtom = atom(null, (get, set, payload: { blockId: string; sectionId: string }) => {
  const next = new Map(get(collapsedSectionsAtom));
  if (next.delete(payload.sectionId)) {
    set(collapsedSectionsAtom, next);
    return;
  }
  const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
  if (!block) return;
  next.set(payload.sectionId, getSectionItemIds(block, payload.sectionId));
  set(collapsedSectionsAtom, next);
});

/** Unfolds the section holding an item, so revealing that item has something to scroll to. */
export const expandSectionOfItemAtom = atom(null, (get, set, payload: { blockId: string; itemId: string }) => {
  const block = get(tripBlocksAtom).find((entry) => entry.id === payload.blockId);
  const sectionId = block ? getSectionIdOfItem(block, payload.itemId) : undefined;
  const collapsed = get(collapsedSectionsAtom);
  if (!sectionId || !collapsed.has(sectionId)) return;
  const next = new Map(collapsed);
  next.delete(sectionId);
  set(collapsedSectionsAtom, next);
});
