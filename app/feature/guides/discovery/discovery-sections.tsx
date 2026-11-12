"use client";
import {useEffect,useRef,useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {TravelerGuideCard} from '../guide-card';
import {fetchGuideDiscovery,type GuideDiscoveryEntry} from './search-api';
import {guideCollections,guideIdentity,groupGuidePages,nextGuidePage,type GuideSearchState} from './search-state';
export function GuideCards({guides}:{guides:GuideDiscoveryEntry[]}){
 return <ul className="grid items-stretch gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{guides.map(guide=><li key={guideIdentity(guide)} className="min-w-0"><TravelerGuideCard guide={guide} layout="discovery"/></li>)}</ul>;
}
export function GuideLoading(){return <div role="status" aria-label="Loading guides" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map(index=><div key={index} className="overflow-hidden rounded-2xl border border-border/60 bg-card"><Skeleton className="aspect-3/2 rounded-none"/><div className="space-y-3 p-5"><Skeleton className="h-6 w-4/5"/><Skeleton className="h-4 w-2/3"/><Skeleton className="h-4 w-1/2"/></div></div>)}</div>;}
const descriptions:Record<string,string>={trending:'Guides gaining attention in the past 30 days, with clearly labelled popular and recent picks.',popular:'The most viewed guides in the published catalogue.',seasonal:'Guides with evidence for your selected month or season.',scenic:'Views, landmarks and memorable places to pause.',food:'Local flavors and cafés worth knowing.',sweets:'Bakeries, desserts and sweet discoveries.',relax:'Slow down and find a little space to unwind.',night:'Discover a destination after dark.',nature:'Get closer to parks, trails and the outdoors.'};
function Shelf({collection,title,state}:{collection:string;title:string;state:GuideSearchState}){
 const [expanded,setExpanded]=useState(false),[nearViewport,setNearViewport]=useState(false),root=useRef<HTMLElement>(null);
 useEffect(()=>{const node=root.current;if(!node)return;if(!('IntersectionObserver' in window)){const timer=setTimeout(()=>setNearViewport(true),0);return()=>clearTimeout(timer);}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setNearViewport(true);observer.disconnect();}},{rootMargin:'400px'});observer.observe(node);return()=>observer.disconnect();},[]);
 const criteria={...state,query:'',collections:[collection],sort:state.sort==='relevance'?collection==='popular'?'popular':collection==='trending'?'trending':'relevance':state.sort};
 const query=useInfiniteQuery({enabled:nearViewport,queryKey:['guide-discovery','shelf',collection,criteria],initialPageParam:0,queryFn:({pageParam,signal})=>fetchGuideDiscovery(criteria,pageParam,signal,6),getNextPageParam:nextGuidePage,staleTime:30000,retry:1});
 const guides=groupGuidePages(query.data?.pages??[]).matching;
 if(!query.isPending&&!query.isError&&!guides.length)return null;
 return <section ref={root} aria-labelledby={`guide-shelf-${collection}`} className="space-y-5 border-t border-border/60 pt-8 first:border-t-0 first:pt-0">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id={`guide-shelf-${collection}`} className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{collection==='seasonal'&&state.time==='any'?'Ideas suited to this time of year.':descriptions[collection]}</p></div>{guides.length>0&&!expanded&&query.hasNextPage&&<Button variant="ghost" size="sm" onClick={()=>{setExpanded(true);void query.fetchNextPage();}}>View all<span className="sr-only"> {title.toLowerCase()} guides</span></Button>}</div>
  {query.isPending?<GuideLoading/>:query.isError&&!query.data?<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 text-sm"><p>This collection could not be loaded.</p><Button variant="outline" size="sm" onClick={()=>void query.refetch()}>Try again</Button></div>:<><GuideCards guides={expanded?guides:guides.slice(0,6)}/>{query.data?.pages[0]?.notice&&<p className="text-xs leading-5 text-muted-foreground">{query.data.pages[0].notice}</p>}{expanded&&(query.hasNextPage||query.isFetchNextPageError)&&<div><Button variant="outline" disabled={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':query.isFetchNextPageError?'Retry loading guides':'Load more guides'}</Button>{query.isFetchNextPageError&&<p role="alert" className="mt-2 text-xs text-destructive">More guides could not be loaded. Your current guides are still here.</p>}</div>}</>}
 </section>;
}
export function GuideShelves({state}:{state:GuideSearchState}){
 return <div className="space-y-10">{guideCollections.filter(([key])=>!state.collections.length||state.collections.includes(key)).map(([key,title])=><Shelf key={`${key}:${state.country}:${state.time}:${state.sort}`} collection={key} title={title} state={state}/>)}</div>;
}

