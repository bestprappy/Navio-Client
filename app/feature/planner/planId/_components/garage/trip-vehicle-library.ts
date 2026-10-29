import {savedVehicleSchema,legacyEnergyProfile,type SavedVehicle,type VehiclePatch} from "./vehicle-api";
import {defaultEnergyProfile} from "./energy-selection";
import {tripGarageIds,addTripVehicle,snapshotTripVehicle,type TripEnergyState} from "./trip-energy-state";
export function tripVehicles(state:TripEnergyState|null|undefined,library:SavedVehicle[]):SavedVehicle[]{
 return tripGarageIds(state).flatMap(id=>{const persisted=state?.vehicles?.find(e=>e.vehicle.id===id);const vehicle=persisted?.scope==="trip"?persisted.vehicle:library.find(v=>v.id===id)??persisted?.vehicle;return vehicle?[vehicle]:[];});
}
export function patchTripVehicle(vehicle:SavedVehicle,patch:VehiclePatch):SavedVehicle{
 let profile=vehicle.energyProfile??legacyEnergyProfile(vehicle);let legacy=vehicle.legacyConsumptionConfirmed;
 if(patch.energySelection==="USE_DEFAULT"||patch.energySelection==="RESET_DEFAULT"||patch.energySelection==="USE_RATED_RANGE")profile=defaultEnergyProfile(vehicle.catalog,vehicle.rangeKm,patch.energySelection==="USE_RATED_RANGE");
 if(patch.energySelection==="USER_OVERRIDE"||patch.consumptionKwhPer100km!==undefined){
  const consumption=patch.consumptionKwhPer100km??profile.consumptionKwhPer100km;
  if(!consumption||!Number.isFinite(consumption)||consumption<=0)throw new Error("Enter a valid observed consumption.");
  profile={...profile,modelKind:"CONSUMPTION",selectionMode:"USER_OVERRIDE",consumptionKwhPer100km:consumption,consumptionSource:"USER_OBSERVED",consumptionMeasurementBasis:patch.consumptionProvenance?.consumptionMeasurementBasis??"UNKNOWN",consumptionStandard:"NONE",sourceUrl:null};
 }
 if(patch.energySelection==="CONFIRM_LEGACY")legacy=true;
 return savedVehicleSchema.parse({...vehicle,nickname:patch.nickname??vehicle.nickname,settings:{...vehicle.settings,...patch.settings},energyProfile:profile,consumptionKwhPer100km:profile.consumptionKwhPer100km,legacyConsumptionConfirmed:legacy,updatedAt:new Date().toISOString()});
}

/** Ordinary edits refresh a descriptor without selecting a different calculation vehicle. */
export function updateImportedTripVehicle(state:TripEnergyState|null|undefined,vehicle:SavedVehicle,select:boolean):TripEnergyState{
 if(select)return addTripVehicle(state,vehicle);
 return {...state,initialSocPct:state?.initialSocPct??null,vehicleSnapshot:state?.vehicleSnapshot?.vehicleId===vehicle.id?snapshotTripVehicle(vehicle):state?.vehicleSnapshot??null,
  vehicles:state?.vehicles?.map(entry=>entry.vehicle.id===vehicle.id?{...entry,vehicle}:entry)};
}
