"use client";
import {useQuery} from "@tanstack/react-query";
import {getPlannerSnapshot} from "../planner-api";
import {flushPlannerAutosave} from "../planner-autosave-flush";
import {ShareOptionRow} from "./share-option-row";
import type {PublicationOptions} from "./publication-api";
export function PublicationSectionsOptions({tripId,options,disabled,onChange}:{tripId:string;options:PublicationOptions;disabled:boolean;onChange:(next:PublicationOptions)=>void}){
 const source=useQuery({queryKey:["publication-source",tripId],queryFn:async()=>{await flushPlannerAutosave(tripId);return getPlannerSnapshot(tripId);},staleTime:0,retry:1});
 const blocks=source.data?.blocks??[],energy=source.data?.energyState;
 const lists=blocks.filter(b=>b.kind==="list"&&!b.id.startsWith("starting-part-"));
 const starting=blocks.find(b=>b.id.startsWith("starting-part-"));
 function toggle(key:"listIds"|"excludedVehicleIds"|"confirmedCustomVehicleIds",id:string,include:boolean){const ids=options[key]??[];onChange({...options,[key]:include?[...new Set([...ids,id])]:ids.filter(value=>value!==id)});}
 if(source.isLoading)return <p role="status" className="text-sm text-muted-foreground">Loading saved sections...</p>;
 if(source.isError)return <div role="alert" className="text-sm text-destructive">Could not load the sections to publish. <button type="button" className="underline" onClick={()=>void source.refetch()}>Try again</button></div>;
 return <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4" aria-label="Sections to publish"><h3 className="text-sm font-semibold">Sections to share</h3><p className="text-xs leading-5 text-muted-foreground">Only the selected content becomes public and travels with a copy.</p>
 {starting&&<ShareOptionRow label="Starting Part" description={starting.title||"Introduction and tips"} checked={options.includeStartingPart===true} disabled={disabled} onCheckedChange={checked=>onChange({...options,includeStartingPart:checked})} />}
 {lists.length>0&&<fieldset className="space-y-2"><legend className="mb-2 text-xs font-medium text-muted-foreground">My List</legend>{lists.map(list=><ShareOptionRow key={list.id} label={list.title||"Untitled list"} description={`${list.items.length} entries, in your order`} checked={options.listIds?.includes(list.id)===true} disabled={disabled} onCheckedChange={checked=>toggle("listIds",list.id,checked)} />)}{!options.includeNotes&&<p className="text-xs text-muted-foreground">Enable notes and checklists above to include their content in selected lists.</p>}</fieldset>}
 {energy?.vehicles?.length?<div className="space-y-3"><ShareOptionRow label="Garage" description="Trip vehicle specifications; no account details" checked={options.includeGarage===true} disabled={disabled} onCheckedChange={checked=>onChange({...options,includeGarage:checked})} />{options.includeGarage&&energy.vehicles.map(({vehicle})=>{const catalog=Boolean(vehicle.catalog);return <div key={vehicle.id} className="rounded-xl bg-muted/40 p-3"><ShareOptionRow label={vehicle.nickname||`${vehicle.make} ${vehicle.model}`} description={catalog?"Navio catalogue: included unless removed":"Custom vehicle: confirm before sharing"} checked={catalog?!options.excludedVehicleIds?.includes(vehicle.id):options.confirmedCustomVehicleIds?.includes(vehicle.id)===true} disabled={disabled} onCheckedChange={checked=>toggle(catalog?"excludedVehicleIds":"confirmedCustomVehicleIds",vehicle.id,catalog?!checked:checked)} /></div>;})}</div>:null}
 {!starting&&!lists.length&&!energy?.vehicles?.length&&<p className="text-xs text-muted-foreground">Add a Starting Part, lists or an EV in the planner to share those sections.</p>}
 </section>;
}
