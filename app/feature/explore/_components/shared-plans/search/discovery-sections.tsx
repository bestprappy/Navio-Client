"use client";
import {useEffect,useMemo,useState} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {SharedPlanCard} from '../shared-plan-card';
import {fetchPlanSearch} from './search-api';
import {nextPlanSearchPage,shouldRefreshDiscovery} from './search-results';
import type {PlanSearchState} from './search-state';

const sections=[
 {id:'trending',title:'Trending plans',description:'Trips gaining attention through views and copies over the past seven days.',sort:'trending',collection:'trending'},
 {id:'recent',title:'Recently shared',description:'Fresh itineraries shared by travelers.',sort:'recent',collection:''},
 {id:'popular',title:'All-time popular',description:'The most copied trips, followed by the most viewed.',sort:'popular',collection:''},
 {id:'seasonal',title:'Seasonal trips',description:'For this time of year, based on shared travel dates—not a weather forecast.',sort:'trending',collection:'seasonal'},
 {id:'events',title:'Event trips',description:'Trips themed around celebrations with verified dates, during ongoing or upcoming event periods.',sort:'trending',collection:'events'},
] as const;
function DiscoverySection({section,state}:{section:typeof sections[number];state:PlanSearchState}){
 const client=useQueryClient(),[notice,setNotice]=useState('');
 const criteria=useMemo<PlanSearchState>(()=>({...state,sort:state.sort==='relevance'?section.sort:state.sort,collections:section.collection?[section.collection]:[],query:''}),[state,section]);
 const query=useInfiniteQuery({queryKey:['explore-plan-search','discovery',section.id,criteria],initialPageParam:{number:0,revision:undefined as string|undefined},queryFn:({pageParam,signal})=>fetchPlanSearch(criteria,pageParam.number,signal,pageParam.revision,6),getNextPageParam:nextPlanSearchPage,retry:1});
 const plans=[...new Map((query.data?.pages??[]).flatMap(p=>p.matching??p.content).map(p=>[p.token,p])).values()];
 useEffect(()=>{if(query.isError&&shouldRefreshDiscovery(query.error)){void client.resetQueries({queryKey:['explore-plan-search','discovery',section.id,criteria],exact:true}).then(()=>setNotice('This collection changed. Its latest plans have been refreshed.'));}},[query.isError,query.error,client,section.id,criteria]);
 return <section aria-labelledby={`discovery-${section.id}`} className="space-y-5 border-t border-border/60 pt-8 first:border-t-0 first:pt-0">
  <div><h2 id={`discovery-${section.id}`} className="text-xl font-semibold tracking-tight">{section.title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{section.description}</p></div>
  {notice&&<p role="status" className="text-xs text-muted-foreground">{notice}</p>}
  {query.isPending?<div role="status" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2,3,4,5].map(i=><div key={i} className="h-72 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"/>)}<span className="sr-only">Loading {section.title}</span></div>:query.isError&&!query.data?<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 text-sm"><p>This collection could not be loaded.</p><Button variant="outline" size="sm" onClick={()=>void query.refetch()}>Try again</Button></div>:plans.length?<><div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">{plans.map(plan=><SharedPlanCard key={plan.token} plan={plan}/>)}</div>{(query.hasNextPage||query.isFetchNextPageError)&&<div><Button variant="outline" disabled={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':query.isFetchNextPageError?'Try loading more again':'Load more plans'}</Button>{query.isFetchNextPageError&&<p role="alert" className="mt-2 text-xs text-destructive">More plans could not be loaded. Your current selection is still here.</p>}</div>}</>:<p className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-6 text-sm leading-6 text-muted-foreground">{section.id==='trending'?'No recent activity has been recorded for this selection yet. Explore the recently shared plans below.':section.id==='events'?'No qualifying event-themed plans are available for this selection right now.':section.id==='seasonal'?'No plans with matching shared travel dates are available for this selection yet.':'No shared plans match this selection yet.'}</p>}
 </section>;
}
export function DiscoverySections({state}:{state:PlanSearchState}){return <div className="space-y-10">{sections.filter(s=>!state.collections?.length||state.collections.includes(s.id)).map(section=><DiscoverySection key={section.id} section={section} state={state}/>)}</div>;}
