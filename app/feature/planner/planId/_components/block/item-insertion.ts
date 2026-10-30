import { getDayPlacePositions } from "../itinerary/day-anchors";
import { isPlaceItem, type TripBlockData, type TripBlockItem } from "../constants/types";

/** Keep the chosen gap attached to an item even if earlier stops are reordered. */
export function getItemInsertionIndex(block: TripBlockData, beforeItemId?: string): number {
  return beforeItemId === undefined
    ? block.items.length
    : block.items.findIndex((item) => item.id === beforeItemId);
}

export function getItemInsertionLabel(
  block: TripBlockData,
  beforeItemId?: string,
  hasStart = false,
): string | undefined {
  const index = getItemInsertionIndex(block, beforeItemId);
  const next = block.items[index];
  if (!next && beforeItemId !== undefined) return undefined;

  const previous = block.items[index - 1];
  const positions = getDayPlacePositions(block, hasStart);
  if (block.kind !== "list" && previous && next && positions.has(previous.id) && positions.has(next.id)) {
    return `Between stops ${positions.get(previous.id)} and ${positions.get(next.id)}`;
  }

  function describeItem(item: TripBlockItem): string {
    if (isPlaceItem(item)) {
      return block.kind === "list" ? item.name : positions.has(item.id) ? `stop ${positions.get(item.id)}` : "charging stop";
    }
    if (item.type === "section") return item.title.trim() ? `the ${item.title.trim()} section` : "the next section";
    return item.type === "note" ? "note" : "checklist";
  }

  return next ? `Before ${describeItem(next)}` : previous ? `After ${describeItem(previous)}` : "Add the first item";
}
