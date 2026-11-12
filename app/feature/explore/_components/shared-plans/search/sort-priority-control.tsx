"use client";

import {useId,useState} from 'react';
import {ArrowDown,ArrowUp,Check,ChevronDown,ListOrdered} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {planSorts} from './search-state';
import {sortValues,togglePriority,movePriority,type SortOptions} from '@/components/search/sort-priorities';

/** Inline disclosure only: collapsing never edits or applies the parent's draft. */
export function SortPriorityControl<T extends string>({value,onChange,options=planSorts}:{value:T;onChange:(value:T)=>void;options?:SortOptions}){
 const labelFor=(order:string)=>sortValues(order,options).map(key=>options.find(([v])=>v===key)?.[1]??key).join(" \u2192 ");
 const [expanded,setExpanded]=useState(false),id=useId(),selected=sortValues(value,options).filter(key=>key!=='relevance');
 const recommended=selected.length===0;
 const available=options.map(([key])=>key).filter(key=>key!=='relevance');
 const ordered=[...selected,...available.filter(key=>!selected.includes(key))];
 return <section className="rounded-xl border border-border/70 bg-background/60">
  <button type="button" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(open=>!open)} className="sticky top-0 z-10 flex w-full items-center gap-3 rounded-xl bg-background p-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring">
   <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ListOrdered className="size-4" aria-hidden="true"/></span>
   <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Sort by</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground" title={labelFor(value)}>{labelFor(value)}</span></span>
   <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${expanded?'rotate-180':''}`}/>
  </button>
  <div id={id} hidden={!expanded} className="border-t border-border/60 p-2">
   <div role="status" aria-label="Default sorting" data-active={recommended} className={`mb-2 rounded-lg border p-3 ${recommended?'border-primary/30 bg-primary/5':'border-border/60 bg-muted/30'}`}>
    <div className="flex items-center gap-2 text-xs font-semibold"><span aria-hidden="true" className={`flex size-4 shrink-0 items-center justify-center rounded border ${recommended?'border-primary bg-primary text-primary-foreground':'border-border'}`}>{recommended&&<Check className="size-3"/>}</span>Recommended<span className="ml-auto text-[10px] font-normal text-muted-foreground">{recommended?'Active default':'Automatic default'}</span></div>
    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Used automatically when no sorting priorities are selected. Clear your selections to return to Recommended.</p>
   </div>
   <p className="px-2 pb-2 pt-1 text-xs leading-5 text-muted-foreground">Select priorities. The first sorts first; the next breaks ties.</p>
   <fieldset className="space-y-1"><legend className="sr-only">Sorting priorities</legend>{ordered.map(key=>{
    const label=options.find(([option])=>option===key)![1],index=selected.indexOf(key),checked=index>=0,inputId=`${id}-${key}`;
    return <div key={key} className={`flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 ${checked?'bg-primary/5':'hover:bg-muted/50'}`}>
     <input id={inputId} type="checkbox" checked={checked} onChange={()=>onChange(togglePriority(value,key,options) as T)} className="size-4 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"/>
     <label htmlFor={inputId} className="min-w-0 flex-1 cursor-pointer text-xs leading-5">{label}</label>
     {checked&&<><span aria-label={`Priority ${index+1}`} className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[0.65rem] font-semibold tabular-nums text-primary">{index+1}</span><div className="flex shrink-0 gap-0.5"><Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${label} earlier`} disabled={index===0} onClick={()=>onChange(movePriority(value,key,-1,options) as T)}><ArrowUp className="size-3.5"/></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${label} later`} disabled={index===selected.length-1} onClick={()=>onChange(movePriority(value,key,1,options) as T)}><ArrowDown className="size-3.5"/></Button></div></>}
    </div>;
   })}</fieldset>
  </div>
 </section>;
}
