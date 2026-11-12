"use client";
import {useId} from "react";
import {CalendarDays,X} from "lucide-react";
import {CountrySelect} from "../../../places/search-controls";
import {countries} from "../../../places/search-state";
import {PlanFilters,collectionOptions,themeOptions} from "./plan-filters";
import {Button} from "@/components/ui/button";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {CatalogueSearch} from "@/components/search/catalogue-search";
import {explorePlanPath,type ExplorePlan} from "../explore-plans-api";
import type {PlanSearchPage} from "./search-api";
import {hasPlanSearch,durationDays,emptyPlanSearch,planSortLabel,type PlanSearchState} from "./search-state";
const control="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm outline-none hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring";
type Props={knownPlans?:ExplorePlan[];suggestionsUnavailable?:boolean;state:PlanSearchState;draft:string;onDraft:(text:string)=>void;onChange:(state:PlanSearchState)=>void;onSubmit:()=>void;onComposition:(value:boolean)=>void;suggestions?:PlanSearchPage;isUpdating:boolean};
export function PlanSearchControls({suggestionsUnavailable=false,state,draft,onDraft,onChange,onSubmit,onComposition,suggestions,isUpdating}:Props){
 const id=useId();
 const countryName=countries.find(c=>c.code===state.country)?.name;
 const durationInvalid=!!state.duration&&durationDays(state.duration,state.unit)===null;
 const title=(plan:ExplorePlan)=>({id:plan.token,title:plan.title||"Untitled plan",subtitle:[plan.destinationCity,plan.destinationCountry].filter(Boolean).join(", "),href:explorePlanPath(plan.token)});
 return <div className="space-y-4"><div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,1fr)_minmax(15rem,2.2fr)_8.5rem_minmax(12rem,1.1fr)]">
  <CountrySelect value={state.country} onChange={country=>onChange({...state,country})}/>
  <div className="min-w-0 sm:col-span-2 sm:row-start-1 lg:col-span-1 lg:row-start-auto"><CatalogueSearch label="Search shared plans" placeholder="City, country, plan or interest" value={draft} onChange={onDraft} onSearch={query=>{onDraft(query);if(query===draft)onSubmit();else onChange({...state,query});}} onComposition={onComposition} pending={isUpdating} error={suggestionsUnavailable} suggestions={suggestions?.querySuggestions?.map(item=>item.text)??[]} matching={(suggestions?.plans??[]).map(title)} relevant={(suggestions?.relatedPlans??[]).map(title)} contentLabel="plans"/></div>
   <PlanFilters state={state} onChange={onChange}/>
   <div><label htmlFor={`${id}-duration`} className="mb-2 block text-xs font-medium text-muted-foreground">Trip duration</label><div className={`${control} pr-1 ${durationInvalid?"border-destructive":""}`}><CalendarDays className="size-4 shrink-0 text-muted-foreground"/><input id={`${id}-duration`} aria-describedby={`${id}-duration-help`} aria-invalid={durationInvalid} inputMode="numeric" maxLength={8} value={state.duration} onChange={event=>onChange({...state,duration:event.target.value})} placeholder="Any" className="h-full min-w-0 flex-1 bg-transparent outline-none"/><Select value={state.unit} onValueChange={unit=>{if(unit==='days'||unit==='months'||unit==='years')onChange({...state,unit});}}><SelectTrigger aria-label="Duration unit" className="h-9! w-24 shrink-0 rounded-lg border-0 bg-muted/50 px-2.5 text-xs"><SelectValue>{state.unit==='days'?'Days':state.unit==='months'?'Months':'Years'}</SelectValue></SelectTrigger><SelectContent align="end" alignItemWithTrigger={false} className="min-w-28 rounded-xl p-1.5"><SelectItem value="days" className="min-h-9 rounded-lg px-2.5 text-xs data-highlighted:bg-accent">Days</SelectItem><SelectItem value="months" className="min-h-9 rounded-lg px-2.5 text-xs data-highlighted:bg-accent">Months</SelectItem><SelectItem value="years" className="min-h-9 rounded-lg px-2.5 text-xs data-highlighted:bg-accent">Years</SelectItem></SelectContent></Select></div>
    <p id={`${id}-duration-help`} className={`mt-1.5 text-[11px] leading-4 ${durationInvalid?"text-destructive":"text-muted-foreground"}`}>{durationInvalid?"Enter a whole duration between 1 and 36,500 days.":state.unit==="days"?"Match the exact number of itinerary days.":state.unit==="months"?"1 month = 30 itinerary days.":"1 year = 365 itinerary days."}</p>
   </div>
  </div>
  {(state.country||state.duration||state.collections?.length||state.themes?.length||state.sort!=="relevance")&&<div className="flex flex-wrap items-center gap-2 text-xs">{state.sort!=="relevance"&&<span className="px-2 text-muted-foreground">Sorted by: {planSortLabel(state.sort)}</span>}{([...[...collectionOptions].map(([value,label])=>({key:"collections" as const,value,label})),...[...themeOptions].map(([value,label])=>({key:"themes" as const,value,label}))]).filter(option=>(state[option.key]??[]).includes(option.value)).map(option=><Button key={option.value} variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,[option.key]:(state[option.key]??[]).filter(value=>value!==option.value)})}>{option.label}<X className="size-3"/><span className="sr-only">Remove filter</span></Button>)}{countryName&&<Button variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,country:""})}>{countryName}<X className="size-3"/><span className="sr-only">Remove country filter</span></Button>}{state.duration&&<Button variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,duration:""})}>{state.duration} {state.unit}<X className="size-3"/><span className="sr-only">Remove duration filter</span></Button>}</div>}
  {!hasPlanSearch(state)&&(state.country||state.duration||state.collections?.length||state.sort!=="relevance")&&<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={()=>onChange({...emptyPlanSearch})}>Clear all</Button>}
 </div>;
}
