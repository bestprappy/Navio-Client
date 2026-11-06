"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Globe2, MapPin, Route, Search, X } from "lucide-react";
import { CountrySelect } from "../../../places/search-controls";
import { countries } from "../../../places/search-state";
import {PlanFilters,collectionOptions,themeOptions} from "./plan-filters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { explorePlanPath, type ExplorePlan } from "../explore-plans-api";
import { buildPlanSuggestions, knownPlanSuggestions,completePlanDestination } from "./search-suggestions";
import {currentSearchAssist} from './search-results';
import type { PlanSearchPage } from "./search-api";
import { hasPlanSearch, durationDays, emptyPlanSearch, planSortLabel, type PlanSearchState } from "./search-state";

const control="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm outline-none transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring";
function Highlight({text,query}:{text:string;query:string}) {
 const index=text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
 return index<0||!query ? <>{text}</> : <>{text.slice(0,index)}<strong className="font-semibold text-foreground">{text.slice(index,index+query.length)}</strong>{text.slice(index+query.length)}</>;
}
type Props={knownPlans?:ExplorePlan[];suggestionsUnavailable?:boolean;state:PlanSearchState;draft:string;onDraft:(text:string)=>void;onChange:(state:PlanSearchState)=>void;onSubmit:()=>void;onComposition:(value:boolean)=>void;suggestions?:PlanSearchPage;isUpdating:boolean};
export function PlanSearchControls({knownPlans=[],suggestionsUnavailable=false,state,draft,onDraft,onChange,onSubmit,onComposition,suggestions,isUpdating}:Props){
 const router=useRouter(),id=useId(),root=useRef<HTMLDivElement>(null),list=useRef<HTMLDivElement>(null),composing=useRef(false);
 const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
 const ready=!isUpdating&&draft.trim().length>=2;
 const general=buildPlanSuggestions(draft,state.country,ready?suggestions?.destinations??[]:[],knownPlans);
 const assist=ready?currentSearchAssist(suggestions,{...state,query:draft}):undefined;
 const destinations=general.destinations.filter(d=>!assist||assist.blocked||!draft.toLowerCase().includes(d.label.toLowerCase())).slice(0,2);
 const items=assist?assist.suggestions.filter(s=>s.kind==='rewrite').slice(0,3).concat(assist.suggestions.filter(s=>s.kind!=='rewrite').slice(0,2)):[...new Set([...(ready&&suggestions?.correction?[suggestions.correction]:[]),...(ready?suggestions?.querySuggestions?.map(item=>item.text)??[]:[]),...general.queries])].slice(0,4).map(text=>({text,kind:'rewrite',label:'',availability:'unknown',action:{query:text}}));
 const queries=items.map(item=>item.text);
 const known=knownPlanSuggestions(draft,state,knownPlans);
 const matchingPlans=suggestionsUnavailable||isUpdating?[]:ready&&suggestions?suggestions.plans:known.matching;
 const relatedPlans=suggestionsUnavailable||isUpdating?[]:ready&&suggestions?suggestions.relatedPlans??known.related:known.related;
 const strong=matchingPlans.slice(0,3);
 const relevant=relatedPlans.filter(p=>!strong.some(s=>s.token===p.token)).slice(0,2);
 const plans=[...strong,...relevant];
 const count=destinations.length+queries.length+plans.length;
 const countryName=countries.find(c=>c.code===state.country)?.name;
 const durationInvalid=!!state.duration&&durationDays(state.duration,state.unit)===null;
 useEffect(()=>{const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[]);
 useEffect(()=>{list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({block:"nearest"});},[active]);
 function select(index:number){
  const destination=destinations[index];setOpen(false);setActive(-1);
  if(destination){const next={...state,country:destination.country||state.country,query:completePlanDestination(draft,destination.label)};onDraft(next.query);onChange(next);}
  else if(index<destinations.length+queries.length){const query=items[index-destinations.length].action.query;onDraft(query);onChange({...state,query});}
  else {const plan=plans[index-destinations.length-queries.length];if(plan)router.push(explorePlanPath(plan.token));}
 }
 return <div className="space-y-4">
  <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,1fr)_minmax(15rem,2.2fr)_8.5rem_minmax(12rem,1.1fr)]">
   <CountrySelect value={state.country} onChange={country=>onChange({...state,country})}/>
   <div className="relative min-w-0 sm:col-span-2 sm:row-start-1 lg:col-span-1 lg:row-start-auto" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
    <label htmlFor={id} className="mb-2 block text-xs font-medium text-muted-foreground">Search shared plans</label>
    <form role="search" onSubmit={event=>{event.preventDefault();if(composing.current)return;setOpen(false);setActive(-1);onSubmit();}}>
     <div className={`${control} gap-1 pl-3 pr-1`}>
      <Search className="mr-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true"/>
      <input id={id} role="combobox" aria-expanded={open&&draft.trim().length>=2} aria-controls={`${id}-suggestions`} aria-autocomplete="list" aria-activedescendant={open&&active>=0&&active<count?`${id}-option-${active}`:undefined}
       autoComplete="off" value={draft} placeholder="City, country, plan or place" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
       onFocus={()=>setOpen(true)} onChange={event=>{onDraft(event.target.value);setOpen(true);setActive(-1);}}
       onCompositionStart={()=>{composing.current=true;onComposition(true);}} onCompositionEnd={()=>{composing.current=false;onComposition(false);}}
       onKeyDown={event=>{if(event.nativeEvent.isComposing)return;if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();setOpen(true);setActive(value=>Math.max(-1,Math.min(count-1,value+(event.key==="ArrowDown"?1:-1))));}
        if(event.key==="Escape"){event.preventDefault();setOpen(false);setActive(-1);}
        if(event.key==="Enter"&&open&&active>=0&&active<count){event.preventDefault();select(active);}}}/>
      {draft&&<button type="button" aria-label="Clear search text" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" onClick={()=>{onDraft("");onChange({...state,query:""});setOpen(false);}}><X className="size-3.5"/></button>}
      <button type="submit" aria-label="Search shared plans" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-ring"><ArrowRight className="size-4"/></button>
     </div>
    </form>
    {open&&draft.trim().length>=2&&<div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border/70 bg-popover shadow-lg">
     <div ref={list} id={`${id}-suggestions`} role="listbox" aria-label="Search suggestions" className="max-h-[min(24rem,55dvh)] overflow-y-auto overscroll-contain p-1.5">
      <>
       {destinations.length>0&&<div role="group" aria-label="Destinations"><p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Destinations</p>{destinations.map((destination,index)=><button key={destination.id} type="button" role="option" id={`${id}-option-${index}`} data-index={index} aria-selected={active===index} tabIndex={-1} onMouseEnter={()=>setActive(index)} onMouseDown={event=>event.preventDefault()} onClick={()=>select(index)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${active===index?"bg-muted":"hover:bg-muted/60"}`}>
        {destination.kind==="country"?<Globe2 className="size-4 shrink-0 text-muted-foreground"/>:<MapPin className="size-4 shrink-0 text-muted-foreground"/>}<span className="min-w-0 flex-1"><span className="block truncate text-sm"><Highlight text={destination.label} query={draft.trim()}/></span><span className="block text-xs text-muted-foreground">{destination.kind==="country"?"Country":countries.find(c=>c.code===destination.country)?.name||"City"}</span></span><span className="shrink-0 text-xs text-muted-foreground">{destination.count?`${destination.count} ${destination.count===1?'plan':'plans'}`:destination.count===0?"No plans yet":"Search plans"}</span>
       </button>)}</div>}
       {[{label:'Suggested searches',alternative:false},{label:'Explore alternatives',alternative:true}].map(group=>{const values=items.map((item,index)=>({item,index})).filter(({item})=>(item.kind!=='rewrite')===group.alternative);return values.length>0&&<div key={group.label} role="group" aria-label={group.label}><p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{group.label}</p>{values.map(({item,index})=>{const i=index+destinations.length;return <button key={item.text} type="button" role="option" aria-label={item.text} id={`${id}-option-${i}`} data-index={i} aria-selected={active===i} tabIndex={-1} onMouseEnter={()=>setActive(i)} onMouseDown={event=>event.preventDefault()} onClick={()=>select(i)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${active===i?"bg-muted":"hover:bg-muted/60"}`}><Search className="size-4 shrink-0 text-muted-foreground"/><span className="min-w-0"><span className="block [overflow-wrap:anywhere]"><Highlight text={item.text} query={draft.trim()}/></span>{(group.alternative||item.availability!=='available')&&<span className="mt-0.5 block text-xs text-muted-foreground">{group.alternative?item.label:'Search idea'}{group.alternative&&item.availability!=='available'?' · Search idea':''}</span>}</span></button>;})}</div>;})}
       {isUpdating&&<p role="status" className="px-3 py-2 text-xs text-muted-foreground">Looking for matching shared plans...</p>}
       {[{label:"Matching plans",values:strong,offset:0},{label:"Relevant plans",values:relevant,offset:strong.length}].map(group=><div key={group.label} role="group" aria-label={group.label}><p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{group.label}</p>{!group.values.length&&!isUpdating&&!suggestionsUnavailable&&<p className="px-3 py-2 text-xs text-muted-foreground">No {group.label.toLowerCase()} found.</p>}{group.values.map((plan,index)=>{const i=group.offset+index+destinations.length+queries.length;return <button key={plan.token} type="button" role="option" id={`${id}-option-${i}`} data-index={i} aria-selected={active===i} tabIndex={-1} onMouseEnter={()=>setActive(i)} onMouseDown={event=>event.preventDefault()} onClick={()=>select(i)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${active===i?"bg-muted":"hover:bg-muted/60"}`}><Route className="size-4 shrink-0 text-primary"/><span className="min-w-0"><span className="block truncate text-sm"><Highlight text={plan.title||"Untitled plan"} query={draft.trim()}/></span><span className="block truncate text-xs text-muted-foreground">{group.label==="Relevant plans"&&suggestions?.reasons?.[plan.token]?suggestions.reasons[plan.token]+" \u00b7 ":""}{[plan.destinationCity,plan.destinationCountry].filter(Boolean).join(", ")}{plan.dayCount>0?` / ${plan.dayCount} days`:""}</span></span></button>;})}</div>)}
       {suggestionsUnavailable&&<p className="px-3 py-2 text-xs text-muted-foreground">Live plan suggestions are temporarily unavailable.</p>}
       {!count&&!isUpdating&&<p className="px-3 py-4 text-sm text-muted-foreground">Press Enter to search shared plans for this phrase.</p>}
      </>
     </div>
     <button type="button" onClick={()=>{setOpen(false);setActive(-1);onSubmit();}} className="flex min-h-11 w-full items-center gap-3 border-t border-border/60 px-4 py-3 text-left text-sm hover:bg-muted/60"><Search className="size-4 shrink-0"/><span className="truncate">Search for {"\u201c"}{draft.trim()}{"\u201d"}</span></button>
    </div>}
   </div>
   <PlanFilters state={state} onChange={onChange}/>
   <div><label htmlFor={`${id}-duration`} className="mb-2 block text-xs font-medium text-muted-foreground">Trip duration</label><div className={`${control} pr-1 ${durationInvalid?"border-destructive":""}`}><CalendarDays className="size-4 shrink-0 text-muted-foreground"/><input id={`${id}-duration`} aria-describedby={`${id}-duration-help`} aria-invalid={durationInvalid} inputMode="numeric" maxLength={8} value={state.duration} onChange={event=>onChange({...state,duration:event.target.value})} placeholder="Any" className="h-full min-w-0 flex-1 bg-transparent outline-none"/><Select value={state.unit} onValueChange={unit=>{if(unit==='days'||unit==='months'||unit==='years')onChange({...state,unit});}}><SelectTrigger aria-label="Duration unit" className="h-9! w-24 shrink-0 rounded-lg border-0 bg-muted/50 px-2.5 text-xs"><SelectValue>{state.unit==='days'?'Days':state.unit==='months'?'Months':'Years'}</SelectValue></SelectTrigger><SelectContent align="end" alignItemWithTrigger={false} className="min-w-28 rounded-xl p-1.5"><SelectItem value="days" className="min-h-9 rounded-lg px-2.5 text-xs data-highlighted:bg-accent">Days</SelectItem><SelectItem value="months" className="min-h-9 rounded-lg px-2.5 text-xs data-highlighted:bg-accent">Months</SelectItem><SelectItem value="years" className="min-h-9 rounded-lg px-2.5 text-xs data-highlighted:bg-accent">Years</SelectItem></SelectContent></Select></div>
    <p id={`${id}-duration-help`} className={`mt-1.5 text-[11px] leading-4 ${durationInvalid?"text-destructive":"text-muted-foreground"}`}>{durationInvalid?"Enter a whole duration between 1 and 36,500 days.":state.unit==="days"?"Match the exact number of itinerary days.":state.unit==="months"?"1 month = 30 itinerary days.":"1 year = 365 itinerary days."}</p>
   </div>
  </div>
  {(state.country||state.duration||state.collections?.length||state.themes?.length||state.sort!=="relevance")&&<div className="flex flex-wrap items-center gap-2 text-xs">{state.sort!=="relevance"&&<span className="px-2 text-muted-foreground">Sorted by: {planSortLabel(state.sort)}</span>}{([...[...collectionOptions].map(([value,label])=>({key:"collections" as const,value,label})),...[...themeOptions].map(([value,label])=>({key:"themes" as const,value,label}))]).filter(option=>(state[option.key]??[]).includes(option.value)).map(option=><Button key={option.value} variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,[option.key]:(state[option.key]??[]).filter(value=>value!==option.value)})}>{option.label}<X className="size-3"/><span className="sr-only">Remove filter</span></Button>)}{countryName&&<Button variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,country:""})}>{countryName}<X className="size-3"/><span className="sr-only">Remove country filter</span></Button>}{state.duration&&<Button variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,duration:""})}>{state.duration} {state.unit}<X className="size-3"/><span className="sr-only">Remove duration filter</span></Button>}</div>}
  {!hasPlanSearch(state)&&(state.country||state.duration||state.collections?.length||state.sort!=="relevance")&&<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={()=>onChange({...emptyPlanSearch})}>Clear all</Button>}
 </div>;
}
