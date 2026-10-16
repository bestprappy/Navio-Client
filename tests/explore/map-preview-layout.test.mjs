import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { PlacePreviewPanel } = await import(
  "../../app/feature/planner/planId/_components/place/place-preview-panel.tsx"
);

test("shared preview hosts retain their original layout unless the planner opts in", () => {
  const html = renderToStaticMarkup(React.createElement(PlacePreviewPanel, { place: { name: "Guide place", address: "Town" }, isAdded: false, onClose() {} }));
  assert.match(html, /max-h-\[calc\(100%-2rem\)\]/);
  assert.doesNotMatch(html, /max-h-\[65%\]/);
});

test("planner preview fits its map with visible actions and full details available separately", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlacePreviewPanel, {
      place: {
        name: "Long-detail place",
        address: "Address",
        description: "Description ".repeat(100),
        openingHours:
          "Monday: Closed\nTuesday: 9:00 AM – 4:30 PM\nWednesday: 9:00 AM – 4:30 PM\nSaturday: 9:00 AM – 5:00 PM",
        website: "https://example.com",
      },
      compact: true,
      isAdded: false,
      onClose() {},
      onAddToTrip() {},
    }),
  );
  assert.match(html, /bottom-4/);
  assert.match(html, /max-h-\[calc\(100%-2rem\)\]/);
  assert.doesNotMatch(html, /overflow-y-auto/);
  assert.match(html, /View full place details/);
  assert.match(html, /View opening hours/);
  assert.match(html, /Close place preview/);
  assert.match(html, /Add to trip/);
  assert.match(html, /Website/);
});

test("compact preview preserves result navigation, repeat-visit context and disabled actions", () => {
  const props = { compact: true, place: { name: "Stop", address: "Town" }, total: 3,
    isAdded: true, usageLabel: "Already in Day 1", targetLabel: "Day 2", onClose() {}, onAddToTrip() {} };
  const html = renderToStaticMarkup(React.createElement(PlacePreviewPanel, props));
  assert.match(html, /Previous place/);
  assert.match(html, /Next place/);
  assert.match(html, /Already in Day 1/);
  assert.match(html, /Add another visit to Day 2/);
  const unavailable = renderToStaticMarkup(React.createElement(PlacePreviewPanel, { ...props,
    canAddToTrip: false, addUnavailableReason: "Select a destination first" }));
  assert.match(unavailable, /Select a destination first/);
  assert.match(unavailable, /disabled=""/);
});

test("saved read-only preview retains details access without add or result-navigation controls", () => {
  const html = renderToStaticMarkup(React.createElement(PlacePreviewPanel, {
    compact: true, place: { name: "Saved stop", address: "Town" }, isAdded: true,
    savedToTrip: true, showAddAction: false, onClose() {},
  }));
  assert.match(html, /Saved to trip/);
  assert.match(html, /View full place details/);
  assert.doesNotMatch(html, /Add to trip|Add another visit|Previous place|Next place/);
});
