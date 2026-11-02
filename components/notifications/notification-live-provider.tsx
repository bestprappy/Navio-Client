"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { showNotificationToasts } from "@/components/notifications/notification-toast";
import { notify } from "@/components/toast/notify";
import { useUnreadCount, useViewer } from "@/hooks/use-social";
import {
  isLiveSignal,
  LIVE_CHANNEL,
  LIVE_LOCK,
  mayBringArrivals,
  reconnectDelay,
  selectArrivals,
  signalFromFrame,
  STREAM_URL,
  type LiveSignal,
  unreadCountRose,
} from "@/lib/notifications/live-notifications";
import { listNotifications, notificationKeys } from "@/lib/social-api";

/** Coalesces a burst of frames (a fan-out, several tabs) into one refetch. */
const RECONCILE_DEBOUNCE_MS = 300;
/** Server and browser clocks differ; a toast is allowed for items this much older than mount. */
const CLOCK_SKEW_MS = 30_000;

/**
 * Keeps the bell, inbox and toasts current while the app is open, on every page
 * including the planner. Renders nothing.
 *
 * <ul>
 *   <li>One browser holds one stream: the tab that wins a Web Lock connects and
 *       rebroadcasts each signal to the other tabs over BroadcastChannel. Without
 *       those APIs every tab connects on its own.</li>
 *   <li>The stream carries hints only. Each tab then re-reads its counts and the
 *       newest unread items through the authorised API, so content never travels
 *       on the stream and a missed frame is repaired by the next reconcile, by
 *       window focus, or by the bell's own polling, which also still produces
 *       toasts if the stream is unavailable.</li>
 *   <li>Only notification queries are touched; planner and trip queries are never
 *       invalidated, and nothing here navigates or moves focus.</li>
 * </ul>
 */
export function NotificationLiveProvider() {
  const { signedIn, accountId } = useViewer();
  const client = useQueryClient();
  const unreadCount = useUnreadCount().data?.unreadCount;
  const lastUnreadCount = useRef<number | null>(null);
  const onUnreadRose = useRef<(() => void) | null>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (unreadCount === undefined) return;
    const rose = unreadCountRose(lastUnreadCount.current, unreadCount);
    lastUnreadCount.current = unreadCount;
    if (rose) onUnreadRose.current?.();
  }, [unreadCount]);

  useEffect(() => {
    if (!signedIn || !accountId) return;
    const stop = new AbortController();
    const watermark = Date.now() - CLOCK_SKEW_MS;
    let hydrating = true;
    let wantsArrivals = true;
    let checkingArrivals = false;
    const shownToasts = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    seen.current = new Set();

    const reconcile = async () => {
      const checkArrivals = wantsArrivals;
      wantsArrivals = false;
      checkingArrivals = checkArrivals;
      try {
        await Promise.all([
          client.invalidateQueries({ queryKey: notificationKeys.unread }),
          client.invalidateQueries({ queryKey: ["notifications", "list"] }),
        ]);
        if (!checkArrivals || stop.signal.aborted) return;
        const page = await listNotifications(true, 0, 10, stop.signal);
        const arrivals = selectArrivals(page.content, seen.current, watermark, hydrating);
        page.content.forEach((item) => seen.current.add(item.id));
        hydrating = false;
        // A hidden tab records arrivals without showing them; the bell keeps the count.
        if (document.visibilityState === "visible") {
          showNotificationToasts(arrivals.filter((item) => item.available)).forEach((id) => shownToasts.add(id));
        }
      } catch (error) {
        if (!stop.signal.aborted) {
          console.warn("Live notifications could not check new arrivals.", { component: "NotificationLiveProvider", error });
        }
      } finally {
        checkingArrivals = false;
      }
    };

    const handle = (signal: LiveSignal) => {
      if (mayBringArrivals(signal)) wantsArrivals = true;
      clearTimeout(timer);
      timer = setTimeout(() => void reconcile(), RECONCILE_DEBOUNCE_MS);
    };

    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(LIVE_CHANNEL);
    channel?.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (isLiveSignal(event.data)) handle(event.data);
    });
    const announce = (signal: LiveSignal) => {
      handle(signal);
      channel?.postMessage(signal);
    };

    const holdStream = () =>
      new Promise<void>((release) => {
        let source: EventSource | null = null;
        let retry: ReturnType<typeof setTimeout> | undefined;
        let refusals = 0;

        const connect = () => {
          if (stop.signal.aborted) return;
          source = new EventSource(STREAM_URL);
          source.addEventListener("ready", () => {
            refusals = 0;
            announce("ready");
          });
          source.addEventListener("inbox.changed", (event) => announce(signalFromFrame("inbox.changed", event.data)));
          source.addEventListener("read-state.changed", () => announce("read_state"));
          source.onerror = () => {
            // CONNECTING: a dropped connection the browser is already retrying.
            // CLOSED: the route refused (signed out, busy, down); back off ourselves.
            if (source?.readyState !== EventSource.CLOSED) return;
            source.close();
            retry = setTimeout(connect, reconnectDelay(refusals++));
          };
        };

        stop.signal.addEventListener("abort", () => {
          clearTimeout(retry);
          source?.close();
          release();
        }, { once: true });
        connect();
      });

    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      navigator.locks.request(LIVE_LOCK, { signal: stop.signal }, holdStream).catch((error: unknown) => {
        if (!stop.signal.aborted) console.warn("Live notifications fell back to polling.", { component: "NotificationLiveProvider", error });
      });
    } else {
      void holdStream();
    }
    // Hydrate now even if this tab never holds the stream.
    handle("ready");
    // The count also rises from this reconcile's own refresh; that one is already being checked.
    onUnreadRose.current = () => {
      if (!checkingArrivals) handle("created");
    };

    return () => {
      stop.abort();
      clearTimeout(timer);
      channel?.close();
      onUnreadRose.current = null;
      // One person's notifications must not stay on screen for the next account.
      shownToasts.forEach((id) => notify.dismiss(id));
    };
  }, [signedIn, accountId, client]);

  return null;
}
