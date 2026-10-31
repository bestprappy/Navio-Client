import type { NotificationItem } from "@/lib/validations/social";

/**
 * Pure rules for live notification delivery. The stream only says "your inbox
 * changed"; these decide what the browser does about it. Kept free of React and
 * browser APIs so they can be tested directly.
 */

/** What one tab tells the others, and itself, after a stream frame. */
export type LiveSignal = "ready" | "created" | "removed" | "read_state";

export const LIVE_CHANNEL = "navio-notifications";
export const LIVE_LOCK = "navio-notifications-stream";
export const STREAM_URL = "/api/notifications/stream";

/** Most toasts on screen at once; the rest collapse into a summary. */
export const MAX_VISIBLE_TOASTS = 3;
/** How long an untouched toast stays. Hover or focus pauses it. */
export const TOAST_LIFETIME_MS = 8_000;

const SIGNALS: ReadonlySet<string> = new Set(["ready", "created", "removed", "read_state"]);

export function isLiveSignal(value: unknown): value is LiveSignal {
  return typeof value === "string" && SIGNALS.has(value);
}

/** Reads an `inbox.changed` frame's `{"kind": ...}` body. Unknown or malformed frames still mean "refresh". */
export function signalFromFrame(eventName: string, data: string): LiveSignal {
  if (eventName === "ready") return "ready";
  if (eventName === "read-state.changed") return "read_state";
  try {
    const parsed: unknown = JSON.parse(data);
    if (parsed && typeof parsed === "object" && "kind" in parsed && parsed.kind === "removed") return "removed";
  } catch {
    // A frame we cannot read is still a reason to reconcile.
  }
  return "created";
}

/** Signals after which new arrivals may deserve a toast; the others only refresh counts. */
export function mayBringArrivals(signal: LiveSignal): boolean {
  return signal === "ready" || signal === "created";
}

/**
 * Retry delay after the stream was refused (signed out, service busy or down):
 * 5 s doubling to 5 minutes, with up to 20% jitter so tabs and devices do not
 * reconnect in lockstep. Network drops are retried by EventSource itself.
 */
export function reconnectDelay(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(5_000 * 2 ** Math.max(0, attempt), 300_000);
  return Math.round(base * (0.8 + random() * 0.4));
}

/**
 * Unread notifications that should appear as toasts: not seen in this tab before
 * and not older than the watermark. The first reconcile after mount is
 * hydration and only records what is already there, so opening the app never
 * produces a burst of toasts for old notifications.
 */
export function selectArrivals(
  unread: readonly NotificationItem[],
  seen: ReadonlySet<string>,
  watermark: number,
  hydrating: boolean,
): NotificationItem[] {
  if (hydrating) return [];
  return unread.filter((item) => !seen.has(item.id) && Date.parse(item.createdAt) >= watermark);
}

/** Newest first, then capped for display; returns the overflow count for the summary row. */
export function visibleToasts<T extends { item: NotificationItem }>(toasts: readonly T[]): { shown: T[]; hidden: number } {
  const ordered = [...toasts].sort((a, b) => Date.parse(b.item.createdAt) - Date.parse(a.item.createdAt));
  return { shown: ordered.slice(0, MAX_VISIBLE_TOASTS), hidden: Math.max(0, ordered.length - MAX_VISIBLE_TOASTS) };
}

/** Pages where following a link would interrupt unsaved work, so toast links open a new tab there. */
export function opensInNewTab(pathname: string | null): boolean {
  return !!pathname && /^\/planner\/[^/]+/.test(pathname);
}

export function toastActionLabel(type: NotificationItem["type"]): string {
  switch (type) {
    case "new_follower":
      return "View profile";
    case "followed_post":
      return "View post";
    case "followed_plan":
      return "View plan";
  }
}
