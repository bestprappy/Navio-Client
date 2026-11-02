"use client";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Compass, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SharedPlanCard } from "../shared-plan-card";
import { ExplorePlansError, type ExplorePlan } from "../explore-plans-api";
import { PlanSearchControls } from "./search-controls";
import { fetchPlanSearch } from "./search-api";
import { durationDays, emptyPlanSearch, hasPlanSearch, parsePlanSearch, partitionPlanResults, planSearchParams, type PlanSearchState } from "./search-state";

const grid="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3";
function Cards({plans}:{plans:ExplorePlan[]}){return <div className={grid}>{plans.map(plan=><SharedPlanCard key={plan.token} plan={plan}/>)}</div>;}
function Loading(){return <div role="status" aria-label="Searching shared plans" className={grid}>{[0,1,2].map(i=><div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card"><Skeleton className="aspect-video rounded-none"/><div className="space-y-3 p-5"><Skeleton className="h-6 w-4/5"/><Skeleton className="h-4 w-2/3"/><Skeleton className="h-4 w-1/2"/></div></div>)}</div>;}
export function SharedPlanSearch({children}:{children:ReactNode}){
 const params=useSearchParams(),serialized=params.toString();
 const state=useMemo(()=>parsePlanSearch(new URLSearchParams(serialized)),[serialized]);
 const [input,setInput]=useState({source:state.query,value:state.query}),[composing,setComposing]=useState(false);
 // Reset the local draft only when applied URL text changes, including browser Back.
 if(input.source!==state.query) setInput({source:state.query,value:state.query});
 const draft=input.source===state.query?input.value:state.query;
 const setDraft=(value:string)=>setInput({source:state.query,value});
 const update=useCallback((next:PlanSearchState)=>{
  const current=new URLSearchParams(window.location.search);
  const nextParams=planSearchParams(next,current);nextParams.set("tab","plans");
  const url=`${window.location.pathname}?${nextParams}${window.location.hash}`;
  window.history.replaceState(null,"",url);
 },[]);
 useEffect(()=>{if(composing||draft===state.query)return;const timer=setTimeout(()=>update({...state,query:draft}),250);return()=>clearTimeout(timer);},[draft,state,update,composing]);
 const active=hasPlanSearch(state),valid=!state.duration||durationDays(state.duration,state.unit)!==null;
 const search=useInfiniteQuery({queryKey:["explore-plan-search",state],enabled:active&&valid,
  initialPageParam:0,queryFn:({pageParam,signal})=>fetchPlanSearch(state,pageParam,signal),getNextPageParam:page=>page.last?undefined:page.number+1,
  staleTime:0,retry:(count,error)=>count<1&&!(error instanceof ExplorePlansError&&error.status<500)});
 const first=search.data?.pages[0];
 const {recommendations,results}=useMemo(()=>partitionPlanResults(first?.recommendations||[],search.data?.pages.flatMap(page=>page.content)||[]),[first,search.data]);
 const pendingInput=composing||draft.trim()!==state.query.trim();
 function clear(){setDraft("");update({...emptyPlanSearch});}
 return <div className="space-y-8 sm:space-y-10">
  <PlanSearchControls state={state} draft={draft} onDraft={setDraft} onChange={update} onSubmit={()=>update({...state,query:draft.trim()})} onComposition={setComposing} suggestions={first} isUpdating={pendingInput||search.isFetching&&!search.isFetchingNextPage}/>
  {!active?children:<div className="space-y-8 border-t border-border/60 pt-7 sm:space-y-10">
   <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" aria-live="polite" className="text-sm text-muted-foreground">{pendingInput||search.isPending?"Searching shared plans...":first?`${first.matchedCount} matching ${first.matchedCount===1?"plan":"plans"}`:"Search shared plans"}</p><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs text-muted-foreground">Sort by<select className="h-9 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring" value={state.sort} onChange={e=>update({...state,sort:e.target.value as PlanSearchState["sort"]})}><option value="relevance">Relevance</option><option value="recent">Recently shared</option><option value="trending">Most viewed</option></select></label><Button size="sm" variant="ghost" className="text-xs" onClick={clear}>Clear all</Button></div></div>
   {!valid?<div role="alert" className="rounded-2xl border border-border/60 bg-card p-6 text-sm">Enter a valid whole trip duration, or clear the duration to see matching plans.</div>:search.isPending?<Loading/>:search.isError&&!first?<div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-6"><p className="text-sm">{search.error.message}</p><Button variant="outline" size="sm" onClick={()=>void search.refetch()}><RefreshCw className="size-4"/>Try again</Button></div>:first?.matchedCount===0?<div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card px-5 py-12 text-center"><Compass className="size-7 text-primary/70"/><h2 className="text-lg font-medium">No plans match this selection</h2><p className="max-w-md text-sm leading-6 text-muted-foreground">Try a different destination, a broader search, or remove the duration filter.</p><div className="flex flex-wrap gap-2">{state.country&&<Button size="sm" variant="outline" onClick={()=>update({...state,country:""})}>Remove country filter</Button>}<Button size="sm" variant="ghost" onClick={clear}>Clear all</Button></div></div>:<>
    {recommendations.length>0&&<section className="space-y-5" aria-labelledby="plan-recommendations"><div><h2 id="plan-recommendations" className="text-xl font-semibold tracking-tight">Recommendations</h2><p className="mt-1 text-sm text-muted-foreground">The closest destination and title matches for your search.</p></div><Cards plans={recommendations}/></section>}
    {(results.length>0||search.hasNextPage)&&<section className={`space-y-5 ${recommendations.length?"border-t border-border/60 pt-8":""}`} aria-labelledby="plan-search-results"><div><h2 id="plan-search-results" className="text-xl font-semibold tracking-tight">Search results</h2><p className="mt-1 text-sm text-muted-foreground">{recommendations.length?"More shared plans matching your search and filters.":"Shared plans matching your search and filters."}</p></div><Cards plans={results}/>{(search.hasNextPage||search.isFetchNextPageError)&&<div className="flex flex-col items-center gap-2 pt-2"><Button variant="outline" disabled={search.isFetchingNextPage} onClick={()=>void search.fetchNextPage()}>{search.isFetchingNextPage&&<Loader2 className="size-4 animate-spin"/>}{search.isFetchingNextPage?"Loading...":search.isFetchNextPageError?"Try loading more again":"Load more plans"}</Button>{search.isFetchNextPageError&&<p role="alert" className="text-xs text-destructive">More results could not be loaded. Your current results are still here.</p>}</div>}</section>}
   </>}
  </div>}
 </div>;
}
