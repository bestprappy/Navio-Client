"use client";

import {useEffect,useId,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowRight,BookOpen,Route,Search,X} from "lucide-react";
import {catalogueGroups,type CatalogueTitle} from "./catalogue-model";

type Props={label:string;placeholder:string;value:string;onChange:(value:string)=>void;onSearch:(query:string)=>void;onComposition?:(active:boolean)=>void;pending:boolean;error?:boolean;suggestions:readonly string[];matching:readonly CatalogueTitle[];relevant:readonly CatalogueTitle[];contentLabel:"plans"|"guides"};
/** Catalogue-only autocomplete. Raw input is owned by the parent, never normalized here. */
export function CatalogueSearch({label,placeholder,value,onChange,onSearch,onComposition,pending,error=false,suggestions,matching,relevant,contentLabel}:Props){
 const id=useId(),router=useRouter(),root=useRef<HTMLDivElement>(null),list=useRef<HTMLDivElement>(null),composing=useRef(false);
 const [open,setOpen]=useState(false),[active,setActive]=useState<string|null>(null);
 const groups=catalogueGroups(pending||error?[]:suggestions,pending||error?[]:matching,pending||error?[]:relevant);
 const rows=[...groups.suggestions.map(text=>({key:`query:${text}`,title:text,subtitle:"",href:"",query:text})),...groups.matching.map(item=>({...item,key:item.id,query:null})),...groups.relevant.map(item=>({...item,key:item.id,query:null}))];
 const index=rows.findIndex(row=>row.key===active),visible=open&&value.trim().length>=2;
 useEffect(()=>{const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[]);
 useEffect(()=>{if(index>=0)list.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({block:"nearest"});},[index]);
 function choose(i:number){const row=rows[i];if(!row)return;setOpen(false);setActive(null);if(row.query!==null){onChange(row.query);onSearch(row.query);}else router.push(row.href);}
 function submit(){if(composing.current)return;setOpen(false);setActive(null);onSearch(value);}
 const sections=[{label:"Suggested searches",items:groups.suggestions.map(text=>({id:`query:${text}`,title:text,subtitle:"",href:""})),offset:0},{label:`Matching ${contentLabel}`,items:groups.matching,offset:groups.suggestions.length},{label:`Relevant ${contentLabel}`,items:groups.relevant,offset:groups.suggestions.length+groups.matching.length}];
 const Icon=contentLabel==='guides'?BookOpen:Route;
 return <div ref={root} className="relative min-w-0" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <label htmlFor={id} className="mb-2 block text-xs font-medium text-muted-foreground">{label}</label>
  <form role="search" onSubmit={event=>{event.preventDefault();submit();}}>
   <div className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card pl-3 pr-1 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
    <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground"/>
    <input id={id} role="combobox" aria-expanded={visible} aria-controls={visible?`${id}-list`:undefined} aria-autocomplete="list" aria-activedescendant={visible&&index>=0?`${id}-${index}`:undefined} autoComplete="off" maxLength={200} value={value} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
     onChange={event=>{onChange(event.target.value);setOpen(true);setActive(null);}} onFocus={()=>setOpen(true)}
     onCompositionStart={()=>{composing.current=true;onComposition?.(true);}} onCompositionEnd={()=>{composing.current=false;onComposition?.(false);}}
     onKeyDown={event=>{if(event.nativeEvent.isComposing)return;if(event.key==='Escape'){event.preventDefault();setOpen(false);setActive(null);}if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(true);const next=Math.max(-1,Math.min(rows.length-1,index+(event.key==='ArrowDown'?1:-1)));setActive(rows[next]?.key??null);}if(event.key==='Enter'&&visible&&index>=0){event.preventDefault();choose(index);}}}/>
    {value&&<button type="button" aria-label="Clear search text" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" onClick={()=>{onChange('');onSearch('');setOpen(false);setActive(null);}}><X aria-hidden="true" className="size-3.5"/></button>}
    <button type="submit" aria-label={label} className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-ring"><ArrowRight aria-hidden="true" className="size-4"/></button>
   </div>
  </form>
  {visible&&<div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border/70 bg-popover shadow-lg">
   <div role="status" aria-live="polite" className={pending||error?'px-4 pt-3 text-xs text-muted-foreground':'sr-only'}>{pending?'Looking for publications...':error?'Suggestions could not be loaded. Try searching again.':`${rows.length} suggestions available`}</div>
   <div ref={list} id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`} className="max-h-[min(27rem,55dvh)] overflow-y-auto overscroll-contain p-1.5">
    {sections.map((section,groupIndex)=><div key={section.label} role="group" aria-label={section.label}>
     <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</p>
     {!section.items.length&&!pending&&!error&&<p className="px-3 py-2 text-xs leading-5 text-muted-foreground">{groupIndex===0?'No catalogue-based suggestions yet. You can still search this phrase.':`No ${section.label.toLowerCase()} found.`}</p>}
     {section.items.map((item,i)=>{const position=section.offset+i;return <button key={item.id} id={`${id}-${position}`} data-index={position} type="button" role="option" aria-selected={position===index} tabIndex={-1} onMouseDown={event=>event.preventDefault()} onMouseEnter={()=>setActive(rows[position].key)} onClick={()=>choose(position)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${position===index?'bg-muted':'hover:bg-muted/60'}`}>
      {groupIndex===0?<Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground"/>:<Icon aria-hidden="true" className="size-4 shrink-0 text-primary"/>}
      <span className="min-w-0"><span className="block text-sm [overflow-wrap:anywhere]">{item.title}</span>{item.subtitle&&<span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.subtitle}</span>}</span>
     </button>;})}
    </div>)}
   </div>
   <button type="button" onMouseDown={event=>event.preventDefault()} onClick={submit} className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-3 text-left text-sm hover:bg-muted/60"><Search aria-hidden="true" className="size-4 shrink-0"/><span className="truncate">Search for &ldquo;{value.trim()}&rdquo;</span></button>
  </div>}
 </div>;
}
