import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const require = createRequire(import.meta.url);
const formatters = await import("../../app/feature/planner/planId/_components/garage/garage-formatters.ts");
const display = await import("../../app/feature/planner/planId/_components/garage/energy-display.ts");
const projection = await import("../../app/feature/planner/planId/_components/garage/trip-energy-projection.ts");
const optimizationFormat = await import("../../app/feature/planner/planId/_components/charger/ev-optimization-format.ts");

const deps = {
  jotai:{ useAtomValue:() => 12 },
  "@/lib/utils":{ cn:(...values) => values.filter(Boolean).join(" ") },
  "./garage.atoms":{ arrivalReservePctAtom:{} },
  "./battery-route-chart":{ BatteryRouteChart:() => createElement("div", null, "chart") },
  "./garage-formatters":formatters,
  "./energy-display":display,
};
const source = readFileSync(new URL("../../app/feature/planner/planId/_components/garage/route-estimate.tsx", import.meta.url), "utf8");
const exports = {};
vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,
  {exports, require:name => deps[name] ?? require(name)});
const render = props => renderToStaticMarkup(createElement(exports.RouteEstimate, {
  startBatteryPct:80, endBatteryPct:40, distanceKm:100, drivingMinutes:90, energyKwh:18, chargeMinutes:0, compatibleStops:0, incompatibleStops:0, ...props,
}));

test("a leg the battery cannot reach is called out instead of reading as missing data", () => {
  const html = render({ infeasible:true, endBatteryPct:null });
  assert.match(html, /role="alert"/);
  assert.match(html, /runs out/i);
  assert.doesNotMatch(html, /prediction unavailable/i);
});

test("missing data still reads as unavailable rather than as an empty battery", () => {
  const html = render({ endBatteryPct:null });
  assert.match(html, /prediction unavailable/i);
  assert.doesNotMatch(html, /runs out/i);
});

test("an arrival below reserve is flagged even when a charge at that stop lifts the end of day", () => {
  assert.match(render({ predictedBelowReserve:true, endBatteryPct:70 }), /below your 12% reserve/);
});

test("a below-reserve end of day is not flagged a second time", () => {
  assert.doesNotMatch(render({ predictedBelowReserve:true, endBatteryPct:8 }), /role="alert"/);
});

test("a station with no connector data is unknown, not a confirmed mismatch", () => {
  const car = { connectorTypes:["CCS2"], chargingCapabilities:{acKw:7,dcKw:50} };
  assert.equal(projection.chargingEventForCar({ connectorTypes:[], maxKw:50, estimatedChargeMinutes:null }, car).compatible, null);
  assert.equal(projection.chargingEventForCar({ connectorTypes:["TYPE2"], maxKw:50, estimatedChargeMinutes:null }, car).compatible, false);
});

test("optimizer charging times read as rounded durations", () => {
  const add = optimizationFormat.describeOperation({ type:"ADD_CHARGER", estimatedChargeMinutes:32.39412, charger:{ name:"Station" } });
  assert.equal(add, "Add Station (32 min)");
  assert.equal(optimizationFormat.describeOperation({ type:"ADD_CHARGER", estimatedChargeMinutes:75.5, charger:{ name:"Station" } }), "Add Station (1 hr 16 min)");
});

test("operations from different legs with the same sequence keep distinct list keys", () => {
  const operations = [
    { type:"ADD_CHARGER", sequence:1, oldItemId:null, charger:{ id:"a" } },
    { type:"ADD_CHARGER", sequence:1, oldItemId:null, charger:{ id:"b" } },
    { type:"ADD_CHARGER", sequence:1, oldItemId:null, charger:{ id:"a" } },
  ];
  assert.equal(new Set(operations.map(optimizationFormat.operationKey)).size, 3);
});
