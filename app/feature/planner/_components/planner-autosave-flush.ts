/**
 * Lets a caller outside the planner force its pending autosave to complete.
 *
 * <p>Publishing is a promise about specific content, and the planner saves on a
 * debounce: an owner who edits a stop and presses Publish within the delay would
 * otherwise freeze the version from *before* their edit. Sharing the autosave
 * mutation scope is not enough on its own — a scope orders mutations that have
 * started, and a debounced save has not started yet.
 *
 * <p>The registry is keyed by trip id and holds at most the mounted planner, so a
 * caller reached from the dashboard (where no planner is mounted) simply gets
 * {@code null} and reads the saved version from the server instead.
 */

/** Resolves to the trip version that is now saved on the server. */
type FlushHandler = () => Promise<number>;

const handlers = new Map<string, FlushHandler>();

export function registerPlannerAutosaveFlush(tripId: string, handler: FlushHandler): () => void {
  handlers.set(tripId, handler);
  return () => {
    // Only remove our own: a remount can register the replacement before the
    // outgoing effect cleans up, and deleting unconditionally would drop it.
    if (handlers.get(tripId) === handler) handlers.delete(tripId);
  };
}

/**
 * Flushes the open planner's pending save.
 *
 * @returns the saved trip version, or null when this trip's planner is not
 *          mounted and there is therefore nothing local to flush
 */
export async function flushPlannerAutosave(tripId: string): Promise<number | null> {
  const handler = handlers.get(tripId);
  if (!handler) return null;
  return handler();
}
