"use client";
import {useState} from 'react';
import {ChevronDown,SlidersHorizontal} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {applyPlanFilters,emptyPlanSearch,planSorts,type PlanSearchState} from './search-state';

export const collectionOptions=[['seasonal','Seasonal trips'],['events','Event trips']] as const;
export const themeOptions=[['nature','Nature & scenery'],['food','Food'],['culture','Culture'],['ev','EV trips']] as const;
export function PlanFilters({state,onChange}:{state:PlanSearchState;onChange:(state:PlanSearchState)=>void}){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(state);
 const count=(state.collections?.length??0)+(state.themes?.length??0);
 function toggle(key:'collections'|'themes',value:string){setDraft(s=>({...s,[key]:(s[key]??[]).includes(value)?s[key]!.filter(v=>v!==value):[...(s[key]??[]),value]}));}
 return <div><span className="mb-2 block text-xs font-medium text-muted-foreground">Filters</span>
  <Popover open={open} onOpenChange={value=>{setOpen(value);if(value)setDraft(state);}}><PopoverTrigger className="flex h-11 w-full items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring"><SlidersHorizontal className="size-4 text-muted-foreground"/><span>Filters{count?` (${count})`:''}</span><ChevronDown className="ml-auto size-3.5"/></PopoverTrigger>
   <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-5">
    <label className="block text-sm font-semibold">Sort by<select aria-label="Sort by" value={draft.sort} onChange={e=>setDraft(s=>({...s,sort:e.target.value as PlanSearchState['sort']}))} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal">{planSorts.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    {([['collections','Collections',collectionOptions],['themes','Travel interests',themeOptions]] as const).map(([key,label,options])=><fieldset key={key} className="mt-5 border-t border-border/60 pt-4"><legend className="sr-only">{label}</legend><p className="mb-2 text-sm font-semibold">{label}</p><div className="grid grid-cols-2 gap-2">{options.map(([value,text])=><label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 p-2.5 text-xs leading-5 has-checked:border-primary/40 has-checked:bg-primary/5"><input type="checkbox" checked={(draft[key]??[]).includes(value)} onChange={()=>toggle(key,value)} className="accent-primary"/>{text}</label>)}</div></fieldset>)}
    <p className="mt-3 text-xs leading-5 text-muted-foreground">Choices within a group match any selection. Different groups work together.</p>
    <div className="mt-5 flex justify-between gap-3"><Button variant="ghost" size="sm" onClick={()=>setDraft(s=>({...s,sort:emptyPlanSearch.sort,collections:[],themes:[]}))}>Reset</Button><Button size="sm" onClick={()=>{onChange(applyPlanFilters(state,draft));setOpen(false);}}>Apply filters</Button></div>
   </PopoverContent></Popover>
 </div>;
}
