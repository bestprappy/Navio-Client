import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Exercise the actual mutation callbacks with an isolated store and controlled network promises.
function harness() {
  const atoms = { tripBlocksAtom: {}, tripBudgetAtom: {}, tripCurrencyAtom: {}, tripExpensesAtom: {}, applyPlannerServerSnapshotAtom: {} };
  const energyAtom = {}, reserveAtom = {};
  const values = new Map([
    [atoms.tripBlocksAtom, [{id:"day",items:[]}]], [energyAtom, {initialSocPct:80}],
    [atoms.tripBudgetAtom,1000], [atoms.tripCurrencyAtom,{code:"THB"}], [atoms.tripExpensesAtom,[]], [reserveAtom,12],
  ]);
  const get = atom => atom.read ? atom.read(get) : values.get(atom);
  const mutations = [], applied = [], calls = [];
  const state = [];
  let cursor = 0, ready = async () => ({version:7,capabilities:[]});
  class PlannerApiError extends Error { constructor(message,status) { super(message); this.status=status; } }
  const deps = {
    react: { useMemo: fn => fn(), useState: initial => {
      const i=cursor++; if (!(i in state)) state[i]=initial;
      return [state[i],next => {state[i]=next;}];
    } },
    jotai: { atom: read => ({read}), useAtomValue:get, useStore:() => ({get}), useSetAtom:() => snapshot => applied.push(snapshot) },
    "@tanstack/react-query": { useMutation: options => { mutations.push(options); return {}; } },
    "next/navigation": { useParams:() => ({planId:"trip"}) },
    "@/hooks/use-require-auth": { useRequireAuth:() => ({isAuthenticated:true}) },
    "../garage/trip-energy-projection": { energyModelForCar: () => ({modelKind:"CONSUMPTION"}) },
    "../garage/energy-selection": { canAutomaticallyPlan:() => true },
    "../garage/trip-energy-state": { tripEnergyStateAtom:energyAtom },
    "../garage/garage.atoms": { arrivalReservePctAtom:reserveAtom },
    "../overview/trip-builder.atoms": atoms,
    "@/app/feature/planner/_components/optimization-state": {
      optimizationStateKey:(...parts) => JSON.stringify(parts),
      prepareOptimizationSnapshot:async () => { calls.push("flush/read"); return ready(); },
    },
    "@/app/feature/planner/_components/planner-api": {
      PlannerApiError, isPersistedTripId:() => true,
      previewTripEvOptimization:async (_id,payload) => { calls.push(["preview",payload]); return {baseVersion:7}; },
      applyTripEvOptimization:async (_id,payload) => { calls.push(["apply",payload]); return {version:8}; },
    },
    "@/components/ui/button": { Button:"Button" },
  };
  const source=readFileSync(new URL("../../app/feature/planner/planId/_components/charger/ev-route-optimization-panel.tsx",import.meta.url),"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,require:name => deps[name] ?? require(name)});
  exports.EvRouteOptimizationPanel({blockId:"day",vehicle:{},startingSocPct:80,targetSocPct:70});
  const payload={blockId:"day",reserveSocPct:12};
  const key=JSON.stringify([payload,get(atoms.tripBlocksAtom),get(energyAtom),{amount:1000,currency:"THB",expenses:[]}]);
  const preview={payload,key,data:{baseVersion:7}};
  return { mutations, applied, calls, values, atoms, energyAtom, preview, setReady:fn => {ready=fn;} };
}

test("optimization callbacks flush before preview/apply and send the persisted version",async () => {
  const h=harness();
  await h.mutations[0].mutationFn({request:h.preview.payload,key:h.preview.key});
  assert.equal(h.calls[0],"flush/read");
  assert.equal(h.calls[1][0],"preview");
  assert.equal(h.calls[1][1].expectedVersion,7);
  const snapshot=await h.mutations[1].mutationFn(h.preview);
  h.mutations[1].onSuccess(snapshot,h.preview);
  assert.equal(h.calls[2],"flush/read");
  assert.equal(h.calls[3][1].expectedVersion,7);
  assert.equal(h.applied[0].version,8);
});

test("edits during flush and stale server versions prevent optimization requests",async () => {
  const h=harness();
  h.setReady(async () => {h.values.set(h.energyAtom,{initialSocPct:60});return {version:7};});
  await assert.rejects(h.mutations[0].mutationFn({request:h.preview.payload,key:h.preview.key}),/trip changed/);
  assert.equal(h.calls.length,1);
  const stale=harness();
  stale.setReady(async () => ({version:8}));
  await assert.rejects(stale.mutations[1].mutationFn(stale.preview),/trip changed/);
  assert.equal(stale.calls.length,1);
});

test("a successful delayed apply never overwrites newer local itinerary, energy or budget edits",async () => {
  for (const edit of [
    h => h.values.set(h.atoms.tripBlocksAtom,[{id:"day",items:[{id:"new"}]}]),
    h => h.values.set(h.energyAtom,{initialSocPct:60}),
    h => h.values.set(h.atoms.tripBudgetAtom,2000),
    h => h.values.set(h.atoms.tripExpensesAtom,[{id:"new-expense",amount:100}]),
  ]) {
    const h=harness();
    const response=await h.mutations[1].mutationFn(h.preview);
    edit(h);
    assert.throws(() => h.mutations[1].onSuccess(response,h.preview),/newer local edits were kept/);
    assert.equal(h.applied.length,0);
  }
});
