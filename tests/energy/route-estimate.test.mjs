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

const gapCar = { connectorTypes:["CCS2"], chargingCapabilities:{acKw:7,dcKw:50}, energyProfile:{ modelKind:"RATED_RANGE", ratedRangeKm:100, consumptionKwhPer100km:null, usableBatteryCapacityKwh:null } };
const gapStop = (id, lng, observed) => ({ type:"place", id, placeId:id, name:id, address:"", lat:13, lng, observedSocCheckpoint:observed });
const gapDays = (dayTwoStart, observed) => [
  { id:"d1", kind:"itinerary", date:"2026-09-01", title:"", colorId:"mint", items:[gapStop("a",100), gapStop("b",101)] },
  { id:"d2", kind:"itinerary", date:"2026-09-02", title:"", colorId:"mint", items:[gapStop("c",dayTwoStart,observed), gapStop("d",106)] },
];
const gapSegments = [
  { blockId:"d1", fromItemId:"a", toItemId:"b", distanceMeters:60000, status:"routed" },
  { blockId:"d2", fromItemId:"c", toItemId:"d", distanceMeters:30000, status:"routed" },
];

test("a disconnected day is marked unchecked and no battery crosses the gap", () => {
  const day = projection.projectCanonicalTrip(gapDays(105), gapSegments, gapCar, 80).days.get("d2");
  assert.equal(day.startDisconnected, true);
  assert.equal(day.finalBatteryPct, null);
});

test("the unchecked mark derives from the itinerary, so connecting the day rechecks the earlier plan", () => {
  // 80% less 60 km leaves 20%; connected, the next 30 km arrives at -10%, which only shows once the gap is gone.
  const day = projection.projectCanonicalTrip(gapDays(101), gapSegments, gapCar, 80).days.get("d2");
  assert.equal(day.startDisconnected, false);
  assert.equal(day.infeasible, true);
});

test("a reading at the first stop gives a disconnected day its own starting charge", () => {
  const day = projection.projectCanonicalTrip(gapDays(105, { socPct:50 }), gapSegments, gapCar, 80).days.get("d2");
  assert.equal(day.startDisconnected, false);
  assert.equal(day.finalBatteryPct, 20);
});

test("the route estimate names the unchecked day and never reports it as checked or merely unavailable", () => {
  const html = render({ startDisconnected:true, dayNumber:2, startBatteryPct:null, endBatteryPct:null });
  assert.match(html, /Day 2 doesn(&#x27;|')t start where the day before it ends, so its charge wasn(&#x27;|')t checked/);
  assert.doesNotMatch(html, /prediction unavailable/i);
});

const plugCar = { connectorTypes:["TYPE2"], chargingCapabilities:{acKw:43,dcKw:null} };
const mixedStation = power => ({ connectorTypes:["CCS2","TYPE2"], maxKw:150, estimatedChargeMinutes:null, connectorPowerKw:power });

test("charging speed comes from the plug that fits, not the station's fastest plug", () => {
  assert.equal(projection.chargingEventForCar(mixedStation({ CCS2:150, TYPE2:22 }), plugCar).effectivePowerKw, 22);
});

test("a multi-plug stop saved without per-plug speeds is unknown rather than another plug's speed", () => {
  assert.equal(projection.chargingEventForCar(mixedStation(undefined), plugCar).effectivePowerKw, null);
  assert.equal(projection.chargingEventForCar(mixedStation({ CCS2:150 }), plugCar).effectivePowerKw, null);
});

test("a stop with one plug type can still use the station's top speed", () => {
  const station = { connectorTypes:["TYPE2"], maxKw:22, estimatedChargeMinutes:null };
  assert.equal(projection.chargingEventForCar(station, plugCar).effectivePowerKw, 22);
});

test("a stop reported closed gives no confirmed charge", () => {
  const station = { connectorTypes:["TYPE2"], maxKw:22, estimatedChargeMinutes:null, targetBatteryPct:80, stationStatus:"temporarily_closed" };
  assert.equal(projection.chargingEventForCar(station, plugCar).compatible, null);
  assert.equal(projection.isStationReportedClosed(station), true);
  assert.equal(projection.isStationReportedClosed({ ...station, stationStatus:"active" }), false);
  assert.equal(projection.isStationReportedClosed({ ...station, stationStatus:undefined }), false);
});
