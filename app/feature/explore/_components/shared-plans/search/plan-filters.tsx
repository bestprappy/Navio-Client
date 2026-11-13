"use client";
import {useState} from 'react';
import {ChevronDown,SlidersHorizontal} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {applyPlanFilters,emptyPlanSearch,type PlanSearchState} from './search-state';

import {SortPriorityControl} from './sort-priority-control';

export const collectionOptions=[['seasonal','Seasonal trips'],['events','Event trips']] as const;
export const themeOptions=[['nature','Nature & scenery'],['food','Food'],['culture','Culture'],['ev','EV trips']] as const;
export function PlanFilters({state,onChange}:{state:PlanSearchState;onChange:(state:PlanSearchState)=>void}){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(state);
 const count=(state.collections?.length??0)+(state.themes?.length??0)+(state.sort!=='relevance'?1:0);
 function toggle(key:'collections'|'themes',value:string){setDraft(s=>({...s,[key]:(s[key]??[]).includes(value)?s[key]!.filter(v=>v!==value):[...(s[key]??[]),value]}));}
 return <div><span className="mb-2 block text-xs font-medium text-muted-foreground">Filters</span>
  <Popover open={open} onOpenChange={value=>{setOpen(value);if(value)setDraft(state);}}><PopoverTrigger className="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring"><SlidersHorizontal aria-hidden="true" className="size-4 shrink-0 text-muted-foreground"/><span data-filter-label className="whitespace-nowrap leading-5">Filters{count?` (${count})`:''}</span><ChevronDown aria-hidden="true" className="ml-auto size-3.5 shrink-0"/></PopoverTrigger>
   <PopoverContent side="bottom" collisionAvoidance={{side:"none",align:"shift",fallbackAxisSide:"none"}} align="end" className="w-[min(21rem,calc(100vw-2rem))] max-h-[min(27rem,var(--available-height),calc(100dvh-2rem))] gap-0 overflow-hidden rounded-2xl p-0 [overflow-anchor:none]">
    <div className="m-2 mb-0 min-h-0 flex-1 overscroll-contain overflow-y-auto rounded-xl p-2 [scrollbar-gutter:stable] sm:p-3">
    <SortPriorityControl value={draft.sort} onChange={sort=>setDraft(current=>({...current,sort}))}/>

    {([['collections','Collections',collectionOptions],['themes','Travel interests',themeOptions]] as const).map(([key,label,options])=><fieldset key={key} className="mt-4 border-t border-border/60 pt-3"><legend className="sr-only">{label}</legend><p className="mb-2 text-sm font-semibold">{label}</p><div className="grid grid-cols-2 gap-2">{options.map(([value,text])=><label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-2 text-xs leading-5 has-checked:border-primary/40 has-checked:bg-primary/5"><input type="checkbox" checked={(draft[key]??[]).includes(value)} onChange={()=>toggle(key,value)} className="accent-primary"/>{text}</label>)}</div></fieldset>)}
    <p className="mt-3 text-xs leading-5 text-muted-foreground">Choices within a group match any selection. Different groups work together.</p>
    </div>
    <div className="flex shrink-0 justify-between gap-3 border-t border-border/60 bg-popover px-4 py-3 sm:px-5"><Button variant="ghost" size="sm" onClick={()=>setDraft(s=>({...s,sort:emptyPlanSearch.sort,collections:[],themes:[]}))}>Reset</Button><Button size="sm" onClick={()=>{onChange(applyPlanFilters(state,draft));setOpen(false);}}>Apply filters</Button></div>
   </PopoverContent></Popover>
 </div>;
}
