import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { prepareOptimizationSnapshot, optimizationStateKey } = await import("../../app/feature/planner/_components/optimization-state.ts");
const { registerPlannerAutosaveFlush } = await import("../../app/feature/planner/_components/planner-autosave-flush.ts");

test("optimization flushes pending trip state before reading a versioned capable snapshot", async () => {
  const original = globalThis.fetch;
  const order = [];
  const unregister = registerPlannerAutosaveFlush("trip", async () => { order.push("save"); return 7; });
  globalThis.fetch = async () => { order.push("read"); return Response.json({blocks:[],budget:{currency:"THB",amount:0,expenses:[]},version:7,savedAt:new Date().toISOString(),capabilities:["canonical-optimization-v1","precise-charging-v1"]}); };
  try {
    assert.equal((await prepareOptimizationSnapshot("trip")).version, 7);
    assert.deepEqual(order, ["save", "read"]);
  } finally { unregister(); globalThis.fetch = original; }
});
test("optimization refuses old servers, concurrent versions and unmounted planners", async () => {
  const original = globalThis.fetch;
  const unregister = registerPlannerAutosaveFlush("trip", async () => 7);
  try {
    globalThis.fetch = async () => Response.json({blocks:[],budget:{currency:"THB",amount:0,expenses:[]},version:7,savedAt:new Date().toISOString()});
    await assert.rejects(prepareOptimizationSnapshot("trip"), /server update/);
    globalThis.fetch = async () => Response.json({blocks:[],budget:{currency:"THB",amount:0,expenses:[]},version:7,savedAt:new Date().toISOString(),capabilities:["canonical-optimization-v1"]});
    await assert.rejects(prepareOptimizationSnapshot("trip"), /server update/);
    globalThis.fetch = async () => Response.json({blocks:[],budget:{currency:"THB",amount:0,expenses:[]},version:8,savedAt:new Date().toISOString(),capabilities:["canonical-optimization-v1","precise-charging-v1"]});
    await assert.rejects(prepareOptimizationSnapshot("trip"), /trip changed/);
    await assert.rejects(prepareOptimizationSnapshot("unmounted"), /finish loading/);
  } finally { unregister(); globalThis.fetch = original; }
});
test("failed autosave prevents optimization and all trip energy/stop changes invalidate previews", async () => {
  const unregister = registerPlannerAutosaveFlush("trip", async () => { throw new Error("Save rejected"); });
  try { await assert.rejects(prepareOptimizationSnapshot("trip"), /Save rejected/); } finally { unregister(); }
  const payload = {reserveSocPct:12};
  const blocks = [{id:"day",items:[{id:"stop",observedSocCheckpoint:null}]}];
  const energy = {initialSocPct:80,vehicleSnapshot:{vehicleId:"car"}};
  const key = optimizationStateKey(payload, blocks, energy);
  assert.notEqual(key, optimizationStateKey({...payload,reserveSocPct:20}, blocks, energy));
  assert.notEqual(key, optimizationStateKey(payload, [{...blocks[0],items:[]}], energy));
  assert.notEqual(key, optimizationStateKey(payload, [{...blocks[0],items:[{id:"stop",observedSocCheckpoint:{socPct:60}}]}], energy));
  assert.notEqual(key, optimizationStateKey(payload, blocks, {...energy,initialSocPct:70}));
  assert.notEqual(key, optimizationStateKey(payload, blocks, {...energy,vehicleSnapshot:{vehicleId:"other"}}));
  const budget = { amount: 1000, currency: "THB", expenses: [] };
  const budgetKey = optimizationStateKey(payload, blocks, energy, budget);
  assert.notEqual(budgetKey, optimizationStateKey(payload, blocks, energy, {...budget, amount: 2000}));
  assert.notEqual(budgetKey, optimizationStateKey(payload, blocks, energy, {...budget, currency: "USD"}));
  assert.notEqual(budgetKey, optimizationStateKey(payload, blocks, energy, {...budget, expenses: [{id:"expense",amount:100}]}));
});
