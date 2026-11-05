"use client";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery,useQuery,useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SharedPlanCard } from "../shared-plan-card";
import { ExplorePlansError, type ExplorePlan } from "../explore-plans-api";
import { PlanSearchControls } from "./search-controls";
import { requestText, synchronizeDraft } from "./search-draft";
import { fetchPlanSearch } from "./search-api";
import { groupPlanSearchPages,currentSearchAssist,planSearchPresentation,usefulSearchAlternatives,nextPlanSearchPage } from "./search-results";
import {AlternativeSearches,SearchEmptyState} from './search-empty-state';
import { durationDays, emptyPlanSearch, hasPlanSearch, parsePlanSearch, planSearchParams, type PlanSearchState } from "./search-state";

const grid="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3";
function Cards({plans,reasons={}}:{plans:ExplorePlan[];reasons?:Record<string,string>}) {
 return <div className={grid}>{plans.map(plan=><div key={plan.token} className="flex min-w-0 flex-col gap-2">
  {reasons[plan.token]&&<p className="px-1 text-xs text-muted-foreground">{reasons[plan.token]}</p>}
  <SharedPlanCard plan={plan}/>
 </div>)}</div>;
}
function Loading(){return <div role="status" aria-label="Searching shared plans" className={grid}>{[0,1,2].map(i=><div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card"><Skeleton className="aspect-video rounded-none"/><div className="space-y-3 p-5"><Skeleton className="h-6 w-4/5"/><Skeleton className="h-4 w-2/3"/><Skeleton className="h-4 w-1/2"/></div></div>)}</div>;}
export function SharedPlanSearch({children,knownPlans=[]}:{children:ReactNode;knownPlans?:ExplorePlan[]}) {
 const queryClient=useQueryClient();
 const [catalogueNotice,setCatalogueNotice]=useState('');
 const params=useSearchParams(),serialized=params.toString();
 const state=useMemo(()=>parsePlanSearch(new URLSearchParams(serialized)),[serialized]);
 const [ownQueries,setOwnQueries]=useState<string[]>([]);
 const [input,setInput]=useState({source:state.query,value:state.query});
 const [composing,setComposing]=useState(false);
 // URL acknowledgements are not edits. Only external navigation replaces the raw draft.
 const ownQuery=ownQueries.includes(state.query)?state.query:null;
 if(input.source!==state.query) {
  setInput(synchronizeDraft(input,state.query,ownQuery));
  setOwnQueries(previous=>{const index=previous.indexOf(state.query);return index<0?previous:previous.slice(index+1);});
 }
 const draft=input.source===state.query?input.value:synchronizeDraft(input,state.query,ownQuery).value;
 const setDraft=(value:string)=>setInput({source:state.query,value});
 const update=useCallback((next:PlanSearchState)=>{
  const nextParams=planSearchParams(next,new URLSearchParams(window.location.search));nextParams.set("tab","plans");
  setOwnQueries(previous=>[...previous,requestText(next.query)].slice(-8));
  window.history.replaceState(null,"",`${window.location.pathname}?${nextParams}${window.location.hash}`);
 },[]);
 useEffect(()=>{
  if(composing||requestText(draft)===requestText(state.query))return;
  const timer=setTimeout(()=>update({...state,query:draft}),250);
  return()=>clearTimeout(timer);
 },[draft,state,update,composing]);
 useEffect(()=>{
  const restore=()=>{setOwnQueries([]);const query=parsePlanSearch(new URLSearchParams(window.location.search)).query;setInput({source:query,value:query});};
  window.addEventListener("popstate",restore);return()=>window.removeEventListener("popstate",restore);
 },[]);
 const active=hasPlanSearch(state);
 const capabilities=useQuery({queryKey:['plan-search-capabilities'],enabled:Array.from(state.query).length>100,queryFn:({signal})=>fetchPlanSearch({...emptyPlanSearch},0,signal),staleTime:60000,retry:false});
 const maxLength=capabilities.data?.searchAssist?.maxQueryLength??100;
 const queryValid=Array.from(state.query).length<=maxLength;
 const valid=(!state.duration||durationDays(state.duration,state.unit)!==null)&&queryValid;
 const search=useInfiniteQuery({
  queryKey:["explore-plan-search",state],enabled:active&&valid,initialPageParam:{number:0,revision:undefined as string|undefined},
  queryFn:({pageParam,signal})=>fetchPlanSearch(state,pageParam.number,signal,pageParam.revision),getNextPageParam:nextPlanSearchPage,
  staleTime:0,retry:(count,error)=>count<1&&!(error instanceof ExplorePlansError&&error.status<500)
 });
 const first=search.data?.pages[0];
 const assist=currentSearchAssist(first,state);
 const alternatives=usefulSearchAlternatives(assist);
 const {matching,related,reasons}=useMemo(()=>groupPlanSearchPages(search.data?.pages??[]),[search.data]);
 const pendingInput=composing||requestText(draft)!==requestText(state.query),textSearch=!!state.query.trim();
 const presentation=planSearchPresentation(first,alternatives.length,pendingInput||search.isPending);
 const matchingTotal=first?.matchingTotal??first?.matchedCount??0,relatedTotal=first?.relatedTotal??0;
 function clear(){setDraft("");update({...emptyPlanSearch});}
 function choose(query:string){setDraft(query);update({...state,query});}
 function edit(){document.querySelector<HTMLInputElement>('input[role="combobox"]')?.focus();}
 useEffect(()=>{if(search.isError&&search.error instanceof ExplorePlansError&&search.error.status===409){void queryClient.resetQueries({queryKey:['explore-plan-search',state],exact:true}).then(()=>setCatalogueNotice('Published plans have changed. Your results have been refreshed.'));}},[search.isError,search.error,queryClient,state]);
 return <div className="space-y-8 sm:space-y-10">
  <PlanSearchControls knownPlans={knownPlans} suggestionsUnavailable={search.isError} state={state} draft={draft} onDraft={setDraft} onChange={update} onSubmit={()=>update({...state,query:requestText(draft)})} onComposition={setComposing} suggestions={first} isUpdating={pendingInput||search.isFetching&&!search.isFetchingNextPage}/>
  {!active?children:<div className="space-y-8 border-t border-border/60 pt-7 sm:space-y-10">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{pendingInput||search.isPending?"Searching shared plans…":first?`${matchingTotal} matching ${matchingTotal===1?"plan":"plans"}${textSearch?` · ${relatedTotal} relevant`:""}`:"Search shared plans"}</p>
    <div className="flex items-center gap-3">
     <label className="flex items-center gap-2 text-xs text-muted-foreground">Sort by<select className="h-9 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring" value={state.sort} onChange={e=>update({...state,sort:e.target.value as PlanSearchState["sort"]})}><option value="relevance">Relevance</option><option value="recent">Recently shared</option><option value="trending">Most viewed</option></select></label>
     <Button size="sm" variant="ghost" className="text-xs" onClick={clear}>Clear all</Button>
    </div>
   </div>
   {!valid?<div role="alert" className="rounded-2xl border border-border/60 bg-card p-6 text-sm">{queryValid?'Enter a valid whole trip duration, or clear the duration to see matching plans.':capabilities.isFetching?'Checking support for a longer search…':`Use up to ${maxLength} characters for this server. Your search text has been preserved.`}</div>
    :presentation==='loading'?<Loading/>
    :search.isError&&!search.isFetchNextPageError?<div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-6"><p className="text-sm">{search.error.message}</p><Button variant="outline" size="sm" onClick={()=>void search.refetch()}><RefreshCw className="size-4"/>Try again</Button></div>
    :<>
     {first?.correction&&<p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">Suggested wording:<Button variant="link" size="sm" className="h-auto px-1" onClick={()=>{setDraft(first.correction!);update({...state,query:first.correction!});}}>{first.correction}</Button></p>}
     {catalogueNotice&&<p className="text-sm text-muted-foreground">{catalogueNotice}</p>}
     {assist?.blocked?<section className="rounded-2xl border border-border/70 bg-card p-6"><h2 className="text-lg font-semibold">Review your search</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{first?.notice}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={edit}>Edit search</Button>{(state.country||state.duration)&&<Button variant="outline" onClick={()=>update({...state,country:'',duration:''})}>Clear filters</Button>}</div></section>
     :presentation==='empty'?<SearchEmptyState query={state.query} hasFilters={!!(state.country||state.duration)} onEdit={edit} onClearFilters={()=>update({...state,country:'',duration:''})} onBrowse={clear}/>
     :presentation==='alternatives'?<section className="rounded-2xl border border-border/70 bg-card px-5 py-6"><h2 className="text-xl font-semibold">Matching and relevant plans</h2><p className="mt-3 text-sm font-medium">No matching or relevant plans found.</p><p className="mt-1 text-sm text-muted-foreground">Explore an alternative search below.</p></section>:<section className="space-y-5" aria-labelledby="plan-matching-results">
      <div><h2 id="plan-matching-results" className="text-xl font-semibold tracking-tight">{textSearch?"Matching plans":"Search results"}</h2><p className="mt-1 text-sm text-muted-foreground">{textSearch?"The closest matches for your destination and travel interests.":"Shared plans matching your filters."}</p></div>
      {matching.length?<Cards plans={matching}/>:<div className="rounded-2xl border border-border/60 bg-card px-5 py-6 text-sm"><p className="font-medium">No matching plans found.</p><p className="mt-1 text-muted-foreground">{related.length?"You may find a useful alternative in the relevant plans below.":"Try a broader phrase or adjust your filters."}</p></div>}
     </section>}
     {first?.notice&&!assist?.blocked&&<p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{first.notice}</p>}
     {assist?.interpretation&&<p className="text-xs text-muted-foreground">Interests: {assist.interpretation}</p>}
     {textSearch&&relatedTotal>0&&!assist?.blocked&&<section className="space-y-5 border-t border-border/60 pt-8" aria-labelledby="plan-related-results">
      <div><h2 id="plan-related-results" className="text-xl font-semibold tracking-tight">Relevant plans</h2><p className="mt-1 text-sm text-muted-foreground">Broader alternatives connected to your search. Selected filters still apply.</p></div>
      {related.length?<Cards plans={related} reasons={reasons}/>:<p className="rounded-2xl border border-border/60 bg-card px-5 py-6 text-sm text-muted-foreground">{first?.related===undefined?"Relevant search is not available on this server yet.":"No relevant plans found. Try another destination or travel interest."}</p>}
     </section>}
     <AlternativeSearches items={alternatives} onSelect={choose}/>
     {(search.hasNextPage||search.isFetchNextPageError)&&<div className="flex flex-col items-center gap-2 pt-2"><Button variant="outline" disabled={search.isFetchingNextPage} onClick={()=>void search.fetchNextPage()}>{search.isFetchingNextPage&&<Loader2 className="size-4 animate-spin"/>}{search.isFetchingNextPage?"Loading…":search.isFetchNextPageError?"Try loading more again":"Load more plans"}</Button>{search.isFetchNextPageError&&<p role="alert" className="text-xs text-destructive">More results could not be loaded. Your current results are still here.</p>}</div>}
    </>}
  </div>}
 </div>;
}
