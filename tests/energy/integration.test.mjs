import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { projectCanonicalTrip, projectCanonicalCharging } = await import("../../app/feature/planner/planId/_components/garage/trip-energy-projection.ts");
const { snapshotTripVehicle, tripEnergyStateAtom, tripGarageIds, addTripVehicle, removeTripVehicle, tripEnergyStateSchema } = await import("../../app/feature/planner/planId/_components/garage/trip-energy-state.ts");
const { activeEvCarAtom, garageVehiclesSnapshotAtom, garageActiveIdSnapshotAtom, startingBatteryPctAtom } = await import("../../app/feature/planner/planId/_components/garage/garage.atoms.ts");
const { savedVehicleForPlanner } = await import("../../app/feature/planner/planId/_components/garage/vehicle-mappers.ts");
const { savedVehicleFixture } = await import("../garage/data.ts");
const { createStore } = await import("jotai");
const { readPlannerDraft, writePlannerDraft } = await import("../../app/feature/planner/_components/planner-draft.ts");
const { savePlannerSnapshot } = await import("../../app/feature/planner/_components/planner-api.ts");
const { getPlanGarageEvCar, getPlanTemplatePlaceEvChargerDetails } = await import("../../app/feature/planner/planId/_components/constants/template-ev.ts");
const car = { connectorTypes: ["CCS2"], chargingCapabilities: { acKw: null, dcKw: 50 }, energyProfile: {
  modelKind: "RATED_RANGE", ratedRangeKm: 100, consumptionKwhPer100km: null, usableBatteryCapacityKwh: null,
} };
const place = (id, lng, observation) => ({ type:"place",id,placeId:id,name:id,address:"Test",lat:13,lng,observedSocCheckpoint:observation });
const blocks = [{id:"d1",kind:"itinerary",date:"2026-09-01",title:"Day 1",colorId:"mint",items:[place("a",100),place("b",101,{socPct:68})]},
  {id:"d2",kind:"itinerary",date:"2026-09-02",title:"Day 2",colorId:"mint",items:[place("c",101),place("d",102)]}];
const segments = [{blockId:"d1",fromItemId:"a",toItemId:"b",distanceMeters:28000,status:"routed"}, {blockId:"d2",fromItemId:"c",toItemId:"d",distanceMeters:10000,status:"fallback"}];

test("trip garages stay independent, survive reload and never delete reusable vehicles", () => {
  const library = [structuredClone(savedVehicleFixture)];
  const original = structuredClone(library);
  assert.deepEqual(tripGarageIds(undefined), []);
  const first = addTripVehicle({initialSocPct: 42, vehicleSnapshot:null}, library[0]);
  const second = addTripVehicle(undefined, library[0]);
  assert.deepEqual(tripGarageIds(tripEnergyStateSchema.parse(JSON.parse(JSON.stringify(first)))), [library[0].id]);
  assert.equal(first.initialSocPct, 42);
  const removed = removeTripVehicle(first, library[0].id);
  assert.deepEqual(tripGarageIds(removed), []);
  assert.equal(removed.vehicleSnapshot, null);
  assert.equal(removed.initialSocPct, 42);
  assert.deepEqual(tripGarageIds(second), [library[0].id]);
  assert.deepEqual(library, original);
  assert.equal(addTripVehicle(first, library[0]).garageVehicleIds.length, 1);
  assert.deepEqual(tripGarageIds({initialSocPct:null,vehicleSnapshot:snapshotTripVehicle(library[0])}), [library[0].id]);
});

test("trip garage membership remains local on an older server instead of being silently acknowledged", async () => {
  const previous = globalThis.fetch;
  let sent;
  globalThis.fetch = async (_url, options) => {
    if (options?.method === "PUT") { sent = JSON.parse(options.body); return Response.json({version:2,savedAt:new Date().toISOString()}); }
    return Response.json({blocks:[],budget:{currency:"THB",amount:0,expenses:[]},version:1,savedAt:new Date().toISOString(),capabilities:["trip-energy-v1"]});
  };
  try {
    const result = await savePlannerSnapshot("trip", [], {currency:"THB",amount:0,expenses:[]}, 1, addTripVehicle(undefined,savedVehicleFixture));
    assert.equal(sent.energyState, undefined);
    assert.equal(result.localOnlySettings, true);
    assert.equal(result.syncedEnergyState, undefined);
  } finally { globalThis.fetch = previous; }
});
test("canonical itinerary adapter carries observed state across days and exposes missing/fallback distance", () => {
  const result=projectCanonicalTrip(blocks,segments,car,100);
  assert.equal(result.days.get("d1").batteryByItemId.get("b").arrivalPct,72);
  assert.equal(result.days.get("d2").startBatteryPct,68);
  assert.equal(result.summary.finalBatteryPct,58);
  assert.equal(result.summary.totalEnergyKwh,null);
  assert.equal(result.results.at(-1).distanceQuality,"FALLBACK");
  assert.equal(projectCanonicalTrip(blocks,[],car,100).summary.finalBatteryPct,null);
  const discontinuity=structuredClone(blocks);discontinuity[1].items[0].lng=105;
  assert.equal(projectCanonicalTrip(discontinuity,segments,car,100).summary.finalBatteryPct,null);
});
test("trip snapshot survives garage refresh and starting battery changes never write garage state", () => {
  const store=createStore(), saved=structuredClone(savedVehicleFixture);
  store.set(garageVehiclesSnapshotAtom,[savedVehicleForPlanner(saved)]);store.set(garageActiveIdSnapshotAtom,saved.id);
  const snapshot=snapshotTripVehicle(saved);
  store.set(tripEnergyStateAtom,{initialSocPct:0,vehicleSnapshot:snapshot});
  const before=store.get(activeEvCarAtom);
  saved.consumptionKwhPer100km=99;
  store.set(garageVehiclesSnapshotAtom,[savedVehicleForPlanner(saved)]);
  assert.deepEqual(store.get(activeEvCarAtom),before);
  assert.equal(store.get(startingBatteryPctAtom),0);
  assert.equal(store.get(garageVehiclesSnapshotAtom)[0].startingBatteryPct,saved.settings.startingBatteryPct);
  assert.equal(createStore().get(tripEnergyStateAtom),undefined);
});
test("Explore templates provide rated range only and unknown charging evidence", () => {
  const template=getPlanGarageEvCar("v",{make:"EV",model:"Test",year:2026,batteryCapacityKwh:60,rangeKm:480,connectorType:"CCS2"});
  assert.equal(template.energyProfile.modelKind,"RATED_RANGE");
  assert.equal(template.energyProfile.consumptionKwhPer100km,null);
  assert.equal(template.energyProfile.usableBatteryCapacityKwh,null);
  assert.deepEqual(template.chargingCapabilities,{acKw:null,dcKw:null});
  const charger=getPlanTemplatePlaceEvChargerDetails({isEvCharger:true,evPowerKw:50,evConnectors:"CCS2"});
  assert.equal(charger.estimatedChargeMinutes,null);
  assert.equal(projectCanonicalCharging(50,charger,template).chargeMinutes,null);
  assert.deepEqual(projectCanonicalTrip(blocks,segments,template,80),projectCanonicalTrip(structuredClone(blocks),structuredClone(segments),structuredClone(template),80));
});
test("saved draft restores trip state, observations and explicit clears", () => {
  const values=new Map();globalThis.window={localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
  const state={blocks,budget:{currency:"THB",amount:0,expenses:[]},energyState:{initialSocPct:0,vehicleSnapshot:snapshotTripVehicle(savedVehicleFixture)}};
  try {
    assert.equal(writePlannerDraft("trip",1,state),true);
    const reloaded=readPlannerDraft("trip");
    assert.deepEqual(reloaded.energyState,state.energyState);
    assert.equal(reloaded.blocks[0].items[1].observedSocCheckpoint.socPct,68);
    writePlannerDraft("trip",2,{...state,energyState:null});
    assert.equal(readPlannerDraft("trip").energyState,null);
  } finally { delete globalThis.window; }
});
test("capability downgrade omits new fields without claiming they synced", async () => {
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async (_url,init) => {
    if(init?.method==="PUT") { calls.push(JSON.parse(init.body));return Response.json({version:2,savedAt:"2026-09-23"}); }
    return Response.json({blocks:[],budget:{currency:"THB",amount:0,expenses:[]},version:1,savedAt:"2026-09-23",capabilities:[]});
  };
  try {
    const result=await savePlannerSnapshot("trip",blocks,{currency:"THB",amount:0,expenses:[]},1,{initialSocPct:0,vehicleSnapshot:null});
    assert.equal(result.localOnlySettings,true);
    assert.equal(result.syncedEnergyState,undefined);
    assert.equal(calls[0].energyState,undefined);
    assert.equal(calls[0].blocks[0].items[1].observedSocCheckpoint,undefined);
  } finally { globalThis.fetch=original; }
});

test("observed and legacy consumption retain their value without treating declared capacity as usable", () => {
  for (const source of ["USER_OBSERVED", "UNKNOWN"]) {
    const vehicle={...car,energyProfile:{...car.energyProfile,modelKind:"CONSUMPTION",consumptionKwhPer100km:18.125,consumptionSource:source,usableBatteryCapacityKwh:null}};
    const projected=projectCanonicalTrip(blocks,segments,vehicle,100);
    assert.equal(projected.results[1].nominalEnergyKwh,28*18.125/100);
    assert.equal(projected.results[1].nominalSocUsePct,null);
    assert.equal(vehicle.energyProfile.consumptionKwhPer100km,18.125);
    assert.equal(vehicle.energyProfile.consumptionSource,source);
  }
});

test("capable server preserves zero and checkpoints; a version conflict never acknowledges a save", async () => {
  const original=globalThis.fetch, state={initialSocPct:0,vehicleSnapshot:snapshotTripVehicle(savedVehicleFixture)};
  let conflict=false;
  globalThis.fetch=async (_url,init) => {
    if(init?.method==="PUT") {
      const body=JSON.parse(init.body);
      assert.deepEqual(body.energyState,state);
      assert.equal(body.blocks[0].items[1].observedSocCheckpoint.socPct,68);
      assert.equal(body.version,4);
      return conflict ? Response.json({message:"Planner version changed"},{status:409}) : Response.json({version:5,savedAt:"2026-09-24"});
    }
    return Response.json({blocks:[],budget:{currency:"THB",amount:0,expenses:[]},version:4,savedAt:"2026-09-24",capabilities:["trip-energy-v1","observed-soc-v1"]});
  };
  try {
    const result=await savePlannerSnapshot("trip",blocks,{currency:"THB",amount:0,expenses:[]},4,state);
    assert.equal(result.localOnlySettings,false);
    assert.deepEqual(result.syncedEnergyState,state);
    conflict=true;
    await assert.rejects(savePlannerSnapshot("trip",blocks,{currency:"THB",amount:0,expenses:[]},4,state),error=>error.status===409);
  } finally { globalThis.fetch=original; }
});
