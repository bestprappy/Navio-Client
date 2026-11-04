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
const calculation = await import("../../app/feature/planner/planId/_components/garage/ev-calculator.ts");
const projection = await import("../../app/feature/planner/planId/_components/garage/trip-energy-projection.ts");
const formatters = await import("../../app/feature/planner/planId/_components/garage/garage-formatters.ts");
const car = { connectorTypes:["CCS2"], chargingCapabilities:{acKw:7,dcKw:50}, energyProfile:{
  modelKind:"CONSUMPTION", consumptionKwhPer100km:20, usableBatteryCapacityKwh:50, ratedRangeKm:null,
} };
const details = { connectorTypes:["CCS2"], maxKw:50, estimatedChargeMinutes:10, targetBatteryPct:80 };
const carAtom = {}, reserveAtom = {};
const deps = {
  jotai:{ useAtomValue:atom => atom === carAtom ? car : 12, useSetAtom:() => () => {} },
  "@/lib/utils":{ cn:(...values) => values.filter(Boolean).join(" ") },
  "../garage/garage.atoms":{ activeEvCarAtom:carAtom, arrivalReservePctAtom:reserveAtom },
  "../garage/battery-gauge":{ BatteryGauge:({children}) => createElement("div", null, children) },
  "../garage/ev-calculator":calculation,
  "../garage/trip-energy-projection":projection,
  "../garage/garage-formatters":formatters,
  "../overview/trip-builder.atoms":{ updatePlaceItemAtom:{} },
};
const source = readFileSync(new URL("../../app/feature/planner/planId/_components/charger/station-charging-control.tsx", import.meta.url), "utf8");
const exports = {};
vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,
  {exports, require:name => deps[name] ?? require(name)});
const render = (station, arrival) => renderToStaticMarkup(createElement(exports.StationChargingControl,
  {blockId:"day",itemId:"charger",stationName:"Test station",details:station,arrivalPct:arrival}));

test("unknown connector identifiers never establish a compatible match", () => {
  assert.equal(calculation.isCompatible(["OTHER"], ["OTHER"]), false);
  assert.equal(calculation.isCompatible(["CCS2", "OTHER"], ["TYPE2", "OTHER"]), false);
  assert.equal(calculation.isCompatible(["CCS2", "OTHER"], ["CCS2"]), true);
});

test("saved optimizer target stays visible while arrival routing is unavailable", () => {
  const html = render({...details,targetBatteryPct:null,plannedDepartureSocPct:55.125}, null);
  assert.match(html, /aria-valuetext="55 percent"/);
  assert.doesNotMatch(html, /aria-valuetext="100 percent"/);
});

test("an incompatible charger never promises departure at the requested target", () => {
  const html = render({...details,connectorTypes:["TYPE2"]}, 30);
  assert.match(html, /None of this station/);
  assert.match(html, /Leave with <span[^>]*>30%/);
});

test("unknown connector compatibility is explained without asserting a mismatch", () => {
  const html = render({...details,connectorTypes:["OTHER"]}, 30);
  assert.match(html, /compatibility is unconfirmed/i);
  assert.doesNotMatch(html, /None of this station|Leave with/);
});
