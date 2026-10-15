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

test("planner preview stays bottom anchored with a bounded height and scrollable details", () => {
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
  assert.match(html, /max-h-\[65%\]/);
  assert.match(html, /overflow-y-auto/);
  assert.match(html, /Close place preview/);
  assert.match(html, /Add to trip/);
  assert.match(html, /Website/);
});
