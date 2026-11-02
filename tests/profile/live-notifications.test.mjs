import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));

const {
  isLiveSignal,
  mayBringArrivals,
  opensInNewTab,
  reconnectDelay,
  selectArrivals,
  signalFromFrame,
  unreadCountRose,
} = await import("../../lib/notifications/live-notifications.ts");

const MOUNT = Date.parse("2026-10-31T09:00:00Z");
const item = (id, createdAt, type = "followed_plan") => ({
  id, type, actorId: "a", createdAt, read: false, postId: null, postTitle: null, groupSlug: null,
  planToken: "tok", planTitle: "Kyoto", available: true,
});

test("stream frames map to signals, and an unreadable frame still means refresh", () => {
  assert.equal(signalFromFrame("ready", "{}"), "ready");
  assert.equal(signalFromFrame("read-state.changed", '{"kind":"read_state"}'), "read_state");
  assert.equal(signalFromFrame("inbox.changed", '{"kind":"created"}'), "created");
  assert.equal(signalFromFrame("inbox.changed", '{"kind":"removed"}'), "removed");
  assert.equal(signalFromFrame("inbox.changed", "not json"), "created");
});

test("only ready and created frames can bring toasts; read state and removals only refresh counts", () => {
  assert.equal(mayBringArrivals("ready"), true);
  assert.equal(mayBringArrivals("created"), true);
  assert.equal(mayBringArrivals("removed"), false);
  assert.equal(mayBringArrivals("read_state"), false);
});

test("messages from other tabs are accepted only when they are known signals", () => {
  assert.equal(isLiveSignal("created"), true);
  assert.equal(isLiveSignal("navigate"), false);
  assert.equal(isLiveSignal({ kind: "created" }), false);
});

test("hydration records existing unread items without producing any toast", () => {
  const unread = [item("old-1", "2026-10-30T09:00:00Z"), item("new-1", "2026-10-31T09:00:05Z")];
  assert.deepEqual(selectArrivals(unread, new Set(), MOUNT, true), []);
});

test("after hydration only unseen items newer than the watermark become toasts", () => {
  const unread = [
    item("seen", "2026-10-31T09:01:00Z"),
    item("fresh", "2026-10-31T09:02:00Z"),
    item("historic", "2026-10-29T09:00:00Z"),
  ];
  const arrivals = selectArrivals(unread, new Set(["seen"]), MOUNT, false);
  assert.deepEqual(arrivals.map((entry) => entry.id), ["fresh"]);
});

test("refused streams back off from five seconds to five minutes with bounded jitter", () => {
  assert.equal(reconnectDelay(0, () => 0.5), 5_000);
  assert.equal(reconnectDelay(1, () => 0.5), 10_000);
  assert.equal(reconnectDelay(20, () => 0.5), 300_000);
  assert.equal(reconnectDelay(0, () => 0), 4_000);
  assert.equal(reconnectDelay(0, () => 1), 6_000);
});

test("the first polled count is a baseline; only a later rise can bring toasts", () => {
  assert.equal(unreadCountRose(null, 12), false);
  assert.equal(unreadCountRose(4, 4), false);
  assert.equal(unreadCountRose(4, 0), false);
  assert.equal(unreadCountRose(4, 5), true);
});

test("toast links open a new tab only inside a plan, where leaving could lose unsaved work", () => {
  assert.equal(opensInNewTab("/planner/7c1a2347"), true);
  assert.equal(opensInNewTab("/planner/7c1a2347/budget"), true);
  assert.equal(opensInNewTab("/planner/new"), true);
  assert.equal(opensInNewTab("/planner"), false);
  assert.equal(opensInNewTab("/explore"), false);
  assert.equal(opensInNewTab(null), false);
});
