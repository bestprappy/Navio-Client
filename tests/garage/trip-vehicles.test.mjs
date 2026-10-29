import assert from "node:assert/strict";import {register} from "node:module";import {test} from "node:test";
register(new URL("../support/typescript-loader.mjs",import.meta.url));
const {tripVehicles,patchTripVehicle}=await import("../../app/feature/planner/planId/_components/garage/trip-vehicle-library.ts");
const {savedVehicleFixture}=await import("./data.ts");
const {legacyEnergyProfile}=await import("../../app/feature/planner/planId/_components/garage/vehicle-api.ts");
test("copied trip vehicles display without account library membership and scoped edits preserve identity",()=>{
 const vehicle={...savedVehicleFixture,energyProfile:legacyEnergyProfile(savedVehicleFixture)};
 const state={initialSocPct:null,vehicleSnapshot:null,garageVehicleIds:[vehicle.id],vehicles:[{scope:"trip",vehicle}]};
 assert.deepEqual(tripVehicles(state,[]),[vehicle]);
 const edited=patchTripVehicle(vehicle,{nickname:"Our trip EV",settings:{startingBatteryPct:75}});
 assert.equal(edited.nickname,"Our trip EV");assert.equal(edited.settings.startingBatteryPct,75);assert.equal(edited.id,vehicle.id);
 assert.notEqual(vehicle.nickname,"Our trip EV");assert.deepEqual(tripVehicles({...state,garageVehicleIds:[]},[]),[]);
});

 test("editing an inactive imported vehicle preserves the selected calculation vehicle",async()=>{
 const {updateImportedTripVehicle}=await import("../../app/feature/planner/planId/_components/garage/trip-vehicle-library.ts");
 const {snapshotTripVehicle}=await import("../../app/feature/planner/planId/_components/garage/trip-energy-state.ts");
 const first={...savedVehicleFixture,energyProfile:legacyEnergyProfile(savedVehicleFixture)};
 const second={...first,id:"20000000-0000-4000-8000-000000000002",nickname:"Second"};
 const state={initialSocPct:70,vehicleSnapshot:snapshotTripVehicle(first),garageVehicleIds:[first.id,second.id],vehicles:[{scope:"trip",vehicle:first},{scope:"trip",vehicle:second}]};
 const updated=updateImportedTripVehicle(state,{...second,nickname:"Renamed second"},false);
 assert.equal(updated.vehicleSnapshot.vehicleId,first.id);assert.equal(updated.initialSocPct,70);
 assert.equal(updated.vehicles[1].vehicle.nickname,"Renamed second");
 assert.equal(updateImportedTripVehicle(state,second,true).vehicleSnapshot.vehicleId,second.id);
 });
