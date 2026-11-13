"use client";
import {useId,useState} from 'react';
import {CalendarDays,ChevronDown,SlidersHorizontal,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {Select,SelectContent,SelectGroup,SelectItem,SelectLabel,SelectTrigger,SelectValue} from '@/components/ui/select';
import {CatalogueSearch} from '@/components/search/catalogue-search';
import {CountrySelect} from '../../explore/places/search-controls';
import {countries,months,seasons,timeLabel} from '../../explore/places/search-state';
import {SortPriorityControl} from '../../explore/_components/shared-plans/search/sort-priority-control';
import {guideCollections,guideHref,guideIdentity,guideInterests,guideSorts,type GuideSearchState} from './search-state';
import type {GuideDiscoveryPage,GuideDiscoveryEntry} from './search-api';
const timeOption="min-h-8 rounded-lg px-2.5 data-highlighted:bg-primary/10 data-highlighted:text-foreground data-selected:bg-primary/10 data-selected:text-foreground focus:bg-primary/10 focus:text-foreground focus:**:text-foreground not-data-[variant=destructive]:focus:**:text-foreground";
function Filters({state,onChange}:{state:GuideSearchState;onChange:(value:GuideSearchState)=>void}){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(state);
 const count=state.collections.length+state.interests.length+(state.sort!=='relevance'?1:0);
 function toggle(key:'collections'|'interests',value:string){setDraft(s=>({...s,[key]:s[key].includes(value)?s[key].filter(v=>v!==value):[...s[key],value]}));}
 return <div><span className="mb-2 block text-xs font-medium text-muted-foreground">Filters</span><Popover open={open} onOpenChange={value=>{setOpen(value);if(value)setDraft(state);}}>
  <PopoverTrigger className="flex h-11 w-full items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring"><SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground"/><span>Filters{count?` (${count})`:''}</span><ChevronDown aria-hidden="true" className="ml-auto size-3.5"/></PopoverTrigger>
  <PopoverContent side="bottom" collisionAvoidance={{side:"none",align:"shift",fallbackAxisSide:"none"}} align="end" className="max-h-[min(27rem,var(--available-height),calc(100dvh-2rem))] w-[min(21rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-2xl p-0 [overflow-anchor:none]">
   <div className="m-2 mb-0 min-h-0 flex-1 overscroll-contain overflow-y-auto rounded-xl p-2 [scrollbar-gutter:stable] sm:p-3"><SortPriorityControl options={guideSorts} value={draft.sort} onChange={sort=>setDraft(s=>({...s,sort}))}/>
    {([['collections','Collections',guideCollections],['interests','Travel interests',guideInterests]] as const).map(([key,label,options])=><fieldset key={key} className="mt-4 border-t border-border/60 pt-3"><legend className="sr-only">{label}</legend><p className="mb-2 text-sm font-semibold">{label}</p><div className="grid grid-cols-2 gap-2">{options.map(([value,text])=><label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-2 text-xs leading-5 has-checked:border-primary/40 has-checked:bg-primary/5"><input type="checkbox" checked={draft[key].includes(value)} onChange={()=>toggle(key,value)} className="accent-primary"/>{text}</label>)}</div></fieldset>)}
    <p className="mt-3 text-xs leading-5 text-muted-foreground">Choices within a group match any selection. Different groups work together.</p>
   </div>
   <div className="flex shrink-0 justify-between gap-3 border-t border-border/60 bg-popover px-4 py-3"><Button variant="ghost" size="sm" onClick={()=>setDraft(s=>({...s,sort:'relevance',collections:[],interests:[]}))}>Reset</Button><Button size="sm" onClick={()=>{onChange({...state,sort:draft.sort,collections:draft.collections,interests:draft.interests});setOpen(false);}}>Apply filters</Button></div>
  </PopoverContent></Popover></div>;
}
const suggestion=(entry:GuideDiscoveryEntry)=>({id:guideIdentity(entry),title:entry.name,subtitle:[entry.destinationName,entry.country].filter(Boolean).join(', '),href:guideHref(entry)});
export function GuideSearchControls({state,draft,onDraft,onChange,onSearch,onComposition,pending,error,page}:{state:GuideSearchState;draft:string;onDraft:(text:string)=>void;onChange:(state:GuideSearchState)=>void;onSearch:(text:string)=>void;onComposition:(active:boolean)=>void;pending:boolean;error:boolean;page?:GuideDiscoveryPage}){
 const id=useId();
 const chips=[...guideCollections.map(([value,label])=>({key:'collections' as const,value,label})),...guideInterests.map(([value,label])=>({key:'interests' as const,value,label}))].filter(item=>state[item.key].includes(item.value));
 return <div className="space-y-4"><div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,1fr)_minmax(15rem,2.2fr)_8.5rem_minmax(12rem,1.1fr)]">
  <CountrySelect value={state.country} onChange={country=>onChange({...state,country})}/>
  <div className="min-w-0 sm:col-span-2 sm:row-start-1 lg:col-span-1 lg:row-start-auto"><CatalogueSearch label="Search guides" placeholder="City, country, guide or place" value={draft} onChange={onDraft} onSearch={onSearch} onComposition={onComposition} pending={pending} error={error} suggestions={pending?[]:page?.suggestions??[]} matching={pending?[]:(page?.matching??[]).slice(0,3).map(suggestion)} relevant={pending?[]:(page?.relevant??[]).slice(0,2).map(suggestion)} contentLabel="guides"/></div>
  <Filters state={state} onChange={onChange}/>
  <div><label htmlFor={id} className="mb-2 block text-xs font-medium text-muted-foreground">Month or season</label><Select value={state.time} onValueChange={time=>{if(time)onChange({...state,time});}}><SelectTrigger id={id} className="h-11! w-full rounded-xl border-border/70 bg-card px-3 shadow-none"><CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground"/><SelectValue>{timeLabel(state.time)}</SelectValue></SelectTrigger><SelectContent containedScroll side="bottom" collisionAvoidance={{side:"none",align:"shift",fallbackAxisSide:"none"}} align="end" alignItemWithTrigger={false} className="max-h-[min(20rem,var(--available-height))] overscroll-contain rounded-xl p-1.5 [&_[data-slot=select-label]]:px-2.5 [&_[data-slot=select-label]]:pt-3 [&_[data-slot=select-label]]:font-semibold"><SelectItem className={timeOption} value="any">Any time</SelectItem><SelectGroup><SelectLabel>Months</SelectLabel>{months.map((month,index)=><SelectItem className={timeOption} key={month} value={`month:${index+1}`}>{month}</SelectItem>)}</SelectGroup><SelectGroup><SelectLabel>Seasons</SelectLabel>{seasons.map(season=><SelectItem className={timeOption} key={season.id} value={`season:${season.id}`}>{season.label}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
 </div>
 {(chips.length>0||state.country||state.time!=='any'||state.sort!=='relevance')&&<div className="flex flex-wrap items-center gap-2 text-xs">{state.sort!=='relevance'&&<span className="px-2 text-muted-foreground">Sorted by: {state.sort.split(',').map(key=>guideSorts.find(([value])=>value===key)?.[1]).join(' \u2192 ')}</span>}{chips.map(item=><Button key={`${item.key}:${item.value}`} variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,[item.key]:state[item.key].filter(v=>v!==item.value)})}>{item.label}<X className="size-3"/><span className="sr-only">Remove filter</span></Button>)}{state.country&&<Button variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,country:''})}>{countries.find(c=>c.code===state.country)?.name}<X className="size-3"/><span className="sr-only">Remove country</span></Button>}{state.time!=='any'&&<Button variant="outline" size="sm" className="h-8 text-xs" onClick={()=>onChange({...state,time:'any'})}>{timeLabel(state.time)}<X className="size-3"/><span className="sr-only">Remove time</span></Button>}</div>}
 </div>;
}

