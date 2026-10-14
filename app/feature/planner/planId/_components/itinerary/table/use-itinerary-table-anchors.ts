"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";

import type { TripAnchor } from "../../constants/types";
import { itineraryBlocksAtom } from "../../overview/trip-builder.atoms";
import { resolveDayAnchors } from "../day-anchors";
import type { ItineraryTableAnchors } from "../export/itinerary-table";

function toTableAnchor(anchor: TripAnchor | null) {
  return anchor && { name: anchor.name, address: anchor.address };
}

/**
 * Where each day starts and ends, by day ID, for the table and its exports.
 * Shared plans pass their own, since their blocks do not carry anchors.
 */
export function useItineraryTableAnchors(
  override?: ReadonlyMap<string, ItineraryTableAnchors>,
): ReadonlyMap<string, ItineraryTableAnchors> {
  const blocks = useAtomValue(itineraryBlocksAtom);
  return useMemo(() => {
    if (override) return override;
    return new Map([...resolveDayAnchors(blocks)].map(([blockId, anchors]) => [
      blockId,
      { start: toTableAnchor(anchors.start), end: toTableAnchor(anchors.end) },
    ]));
  }, [blocks, override]);
}
