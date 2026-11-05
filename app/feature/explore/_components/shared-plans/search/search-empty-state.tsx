"use client";
import {Compass,Search,ArrowRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {SearchSuggestion} from './search-api';

export function AlternativeSearches({items,onSelect}:{items:SearchSuggestion[];onSelect:(query:string)=>void}){
 if(!items.length)return null;
 return <section aria-labelledby="plan-alternative-searches" className="space-y-4 border-t border-border/60 pt-7">
  <div><h2 id="plan-alternative-searches" className="text-xl font-semibold tracking-tight">Alternative searches</h2><p className="mt-1 text-sm text-muted-foreground">Explore a different focus. Your search changes only when you choose an alternative.</p></div>
  <div className="grid gap-3 sm:grid-cols-2">{items.map(item=><button key={item.text} type="button" onClick={()=>onSelect(item.action.query)} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring"><Search aria-hidden="true" className="size-4 shrink-0 text-primary"/><span className="min-w-0 flex-1"><span className="block text-sm font-medium [overflow-wrap:anywhere]">{item.text}</span><span className="mt-1 block text-xs text-muted-foreground">{item.label}{item.availability==='unknown'?' · Search idea':''}</span></span><ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground"/></button>)}</div>
 </section>;
}
export function SearchEmptyState({query,hasFilters,onEdit,onClearFilters,onBrowse}:{query:string;hasFilters:boolean;onEdit:()=>void;onClearFilters:()=>void;onBrowse:()=>void}){
 return <section className="rounded-2xl border border-border/70 bg-card px-6 py-10 text-center sm:px-10 sm:py-12" aria-labelledby="plan-search-empty-title">
  <Compass aria-hidden="true" className="mx-auto mb-4 size-8 text-primary"/>
  <h2 id="plan-search-empty-title" className="text-xl font-semibold tracking-tight">No plans found for this search.</h2>
  {query&&<p className="mx-auto mt-3 max-w-xl text-sm font-medium [overflow-wrap:anywhere]">“{query}”</p>}
  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Sorry, we couldn’t find any published plans matching your search and selected filters. Try different keywords or adjust your filters.</p>
  <div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={onEdit}><Search className="size-4"/>Edit search</Button>{hasFilters?<Button variant="outline" onClick={onClearFilters}>Clear filters</Button>:<Button variant="outline" onClick={onBrowse}>Browse all plans</Button>}</div>
 </section>;
}
