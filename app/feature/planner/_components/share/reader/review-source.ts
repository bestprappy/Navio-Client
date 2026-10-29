import type {SharedPlan,PublicationOptions} from "../publication-api";
import {toSharedPlanBlocks,toSharedPlanBudget} from "../shared-plan-blocks";
import type {TripBlockData} from "../../../planId/_components/constants/types";
import {snapshotTripVehicle,type TripEnergyState} from "../../../planId/_components/garage/trip-energy-state";
import {legacyEnergyProfile,type SavedVehicle} from "../../../planId/_components/garage/vehicle-api";

/** Full editable example source, used by the real API seed and round-trip integration tests. */
export function reviewPlannerSource(shared:SharedPlan){
 const plan=shared.plan;
 const days=toSharedPlanBlocks(plan).map((block,index)=>({...block,id:`review-day-${index}`}));
 const lists=(plan.lists??[]).map((list,index)=>({...toSharedPlanBlocks({...plan,days:[{...list,date:plan.startDate}],dayCount:1})[0],id:`review-list-${index}`,kind:"list" as const,title:list.title||"My List",date:plan.startDate||"2027-03-10"}));
 const blocks:TripBlockData[]=[...lists,...days];
 if(plan.startingPart)blocks.unshift({id:"starting-part-review",kind:"list",title:plan.startingPart.title,date:plan.startDate||"2027-03-10",colorId:"teal",items:[{id:"review-introduction",type:"note",content:plan.startingPart.content}]});
 const refs=new Map<string,string>();
 for(const [index,block] of blocks.entries())block.items=block.items.map((item,itemIndex)=>{
  const id=`review-item-${index}-${itemIndex}`;
  const originals=block.kind==="itinerary"?plan.days?.[days.findIndex(day=>day.id===block.id)]?.items:plan.lists?.[lists.findIndex(list=>list.id===block.id)]?.items;
  const original=originals?.[itemIndex];if(original?.id)refs.set(original.id,id);
  if(item.type==="place"&&item.evCharger)item={...item,evCharger:{...item.evCharger,totalConnectors:item.evCharger.totalConnectors??1}};
  return {...item,id};
 });
 const budget=toSharedPlanBudget(plan);
 budget.expenses=budget.expenses.map((expense,index)=>{const ref=plan.budget?.expenses?.[index]?.itemRef;const id=ref?refs.get(ref):undefined;return {...expense,id:id?`place-expense-${encodeURIComponent(id)}/${index}`:expense.id};});
 const now=new Date().toISOString();
 const vehicles=(plan.garage??[]).map(entry=>{const vehicle:SavedVehicle={...entry.vehicle,id:crypto.randomUUID(),isDefault:false,createdAt:now,updatedAt:now};return {scope:"trip" as const,vehicle:{...vehicle,energyProfile:vehicle.energyProfile??legacyEnergyProfile(vehicle)},active:entry.active};});
 const active=vehicles.find(entry=>entry.active)??vehicles[0];
 const energyState:TripEnergyState={initialSocPct:active?.vehicle.settings.startingBatteryPct??null,vehicleSnapshot:active?snapshotTripVehicle(active.vehicle):null,garageVehicleIds:vehicles.map(entry=>entry.vehicle.id),vehicles:vehicles.map(({scope,vehicle})=>({scope,vehicle}))};
 const options:PublicationOptions={includeDates:true,includeNotes:true,includeBudget:true,includeStartingPart:true,includeGarage:true,listIds:lists.map(list=>list.id),excludedVehicleIds:[],confirmedCustomVehicleIds:vehicles.filter(entry=>!entry.vehicle.catalog).map(entry=>entry.vehicle.id)};
 return {blocks,budget,energyState,options};
}
