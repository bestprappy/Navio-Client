import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

registerHooks({
  resolve(specifier, context, next) {
    return next(specifier.startsWith(".") && !/\.(?:tsx?|mjs|js)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
  },
  load(url, context, next) {
    if (!url.endsWith(".tsx")) return next(url, context);
    return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
    }).outputText };
  },
});
const { TripEnergyDetails } = await import("../../app/feature/planner/planId/_components/garage/trip-energy-details.tsx");
const block = { id: "day", date: "2026-10-11", items: [{id: "stop", type: "place", name: "Stop B"}] };

test("daily details render unknown values without zero, and expose a native disclosure", () => {
  const html = renderToStaticMarkup(createElement(TripEnergyDetails, {blocks: [block]}));
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
  assert.match(html, /11 Oct 2026/);
  assert.match(html, /Unavailable/);
  assert.doesNotMatch(html, />0(?:%| kWh| min)</);
});

test("daily details preserve separate predicted and observed SoC and escape stop names", () => {
  const days = new Map([["day", {distanceKm: 0, energyKwh: 0, startBatteryPct: 100, finalBatteryPct: 68,
    chargeMinutes: 0, chargeEnergyKwh: 0, batteryByItemId: new Map([["stop", {rawPredictedArrivalSocPct: 72, observedSocPct: 68}]])}]]);
  const html = renderToStaticMarkup(createElement(TripEnergyDetails, {blocks: [{...block, items: [{...block.items[0], name: "<script>"}]}], days}));
  assert.match(html, /predicted arrival 72%; user-observed 68%/);
  assert.match(html, /0 kWh/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
