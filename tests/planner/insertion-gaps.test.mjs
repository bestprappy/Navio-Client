import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createStore, Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

register(new URL("../support/typescript-loader.mjs", import.meta.url));
register("data:text/javascript," + encodeURIComponent(`export async function load(url, context, next) {
  if (url.endsWith('.css')) return { format: 'module', shortCircuit: true,
    source: 'export default new Proxy({}, { get: (_, key) => key });' };
  if (url.endsWith('/next/image.js')) return { format: 'module', shortCircuit: true,
    source: 'import { createElement } from "react"; export default function Image({ unoptimized, ...props }) { return createElement("img", props); }' };
  return next(url, context);
}`), import.meta.url);

const { SortableBlockItems } = await import("../../app/feature/planner/planId/_components/block/sortable-block-items.tsx");
const { tripBlocksAtom, plannerReadOnlyAtom } = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const { longDay } = await import("./place-insertion/data.ts");

function renderItems(readOnly = false, count = 2) {
  const block = { ...longDay, items: longDay.items.slice(0, count) };
  const store = createStore();
  store.set(tripBlocksAtom, [block]);
  store.set(plannerReadOnlyAtom, readOnly);
  const original = store.get(tripBlocksAtom);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(Provider, { store }, React.createElement(SortableBlockItems, { block }))));
  assert.equal(store.get(tripBlocksAtom), original);
  client.clear();
  return html;
}

test("two cards have three independent insertion gaps with correct insertion targets", () => {
  const html = renderItems();
  assert.equal((html.match(/data-insertion-gap="true"/g) ?? []).length, 3);
  assert.match(html, /data-insertion-before="stop-1"/);
  assert.match(html, /data-insertion-before="stop-2" data-insertion-after="stop-1"/);
  assert.match(html, /data-insertion-after="stop-2"/);
  assert.match(html, /Add an item here: before stop 1/);
  assert.match(html, /Add an item here: between stops 1 and 2/);
  assert.match(html, /Add an item here: after stop 2/);
  assert.equal((html.match(/aria-label="Drag item"/g) ?? []).length, 2);
});

test("read-only cards never expose insertion gaps or drag controls", () => {
  const html = renderItems(true);
  assert.doesNotMatch(html, /data-insertion-gap|Add an item here|aria-label="Drag item"/);
  assert.match(html, /trip-item-stop-1/);
  assert.match(html, /trip-item-stop-2/);
});

test("an empty itinerary exposes one insertion gap, including between day anchors", () => {
  assert.equal((renderItems(false, 0).match(/data-insertion-gap="true"/g) ?? []).length, 1);
  assert.doesNotMatch(renderItems(true, 0), /data-insertion-gap/);
});
