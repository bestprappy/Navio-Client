import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({resolve(specifier,context,next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
}});
const { searchEvChargerAnchors } = await import("../../app/feature/planner/planId/_components/charger/ev-station-api.ts");
const anchors = [{id:"first",lat:13,lng:100},{id:"second",lat:14,lng:101}];

test("one failed route-area search preserves stations from successful areas", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async url => new URL(url,"http://localhost").searchParams.get("lat") === "13"
    ? Response.json({message:"Unavailable"},{status:503}) : Response.json({items:[{id:"station"}]});
  try {
    const result = await searchEvChargerAnchors(anchors);
    assert.equal(result.partialFailure,true);
    assert.deepEqual(result.results,[{place:anchors[1],chargers:[{id:"station"}]}]);
  } finally {globalThis.fetch=old;}
});

test("a complete search outage stays an error instead of an empty search result", async () => {
  const old=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({message:"Unavailable"},{status:503});
  try { await assert.rejects(searchEvChargerAnchors(anchors),/503/); }
  finally {globalThis.fetch=old;}
});

test("successful empty search and missing anchors have no partial-failure warning", async () => {
  const old=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({items:[]});
  try {
    assert.deepEqual(await searchEvChargerAnchors([]),{results:[],partialFailure:false});
    const result=await searchEvChargerAnchors(anchors);
    assert.equal(result.partialFailure,false);
    assert.equal(result.results.length,2);
  } finally {globalThis.fetch=old;}
});
