"use client";
import {useCallback,useEffect,useMemo,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useInfiniteQuery,useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {requestText,synchronizeDraft} from '../../explore/_components/shared-plans/search/search-draft';
import {GuideSearchControls} from './search-controls';
import {GuideCards,GuideLoading,GuideShelves} from './discovery-sections';
import {fetchGuideDiscovery} from './search-api';
import {emptyGuideSearch,guideResultMode,guideSearchParams,groupGuidePages,nextGuidePage,parseGuideSearch,type GuideSearchState} from './search-state';
export function GuidesExplorer(){
 const params=useSearchParams(),serialized=params.toString();
 const state=useMemo(()=>parseGuideSearch(new URLSearchParams(serialized)),[serialized]);
 const [ownQueries,setOwnQueries]=useState<string[]>([]),[input,setInput]=useState({source:state.query,value:state.query}),[composing,setComposing]=useState(false);
 const ownQuery=ownQueries.includes(state.query)?state.query:null;
 if(input.source!==state.query){setInput(synchronizeDraft(input,state.query,ownQuery));setOwnQueries(previous=>{const index=previous.indexOf(state.query);return index<0?previous:previous.slice(index+1);});}
 const draft=input.source===state.query?input.value:synchronizeDraft(input,state.query,ownQuery).value;
 const setDraft=(value:string)=>setInput({source:state.query,value});
 const update=useCallback((next:GuideSearchState)=>{const nextParams=guideSearchParams(next,new URLSearchParams(window.location.search));setOwnQueries(previous=>[...previous,requestText(next.query)].slice(-8));window.history.replaceState(null,'',`${window.location.pathname}?${nextParams}${window.location.hash}`);},[]);
 useEffect(()=>{if(composing||requestText(draft)===state.query)return;const timer=setTimeout(()=>update({...state,query:draft}),250);return()=>clearTimeout(timer);},[draft,state,composing,update]);
 useEffect(()=>{const restore=()=>{setOwnQueries([]);const query=parseGuideSearch(new URLSearchParams(window.location.search)).query;setInput({source:query,value:query});};window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);},[]);
 const active=guideResultMode(state),valid=Array.from(state.query).length<=200;
 const result=useInfiniteQuery({queryKey:['guide-discovery','results',state],enabled:active&&valid,initialPageParam:0,queryFn:({pageParam,signal})=>fetchGuideDiscovery(state,pageParam,signal),getNextPageParam:nextGuidePage,staleTime:30000,retry:1});
 const catalogue=useQuery({queryKey:['guide-discovery','availability',state],enabled:!active,queryFn:({signal})=>fetchGuideDiscovery(state,0,signal,1),staleTime:30000,retry:1});
 const first=result.data?.pages[0],groups=useMemo(()=>groupGuidePages(result.data?.pages??[]),[result.data]);
 const pendingInput=composing||requestText(draft)!==state.query;
 function choose(query:string){setDraft(query);update({...state,query});}
 function clear(){setDraft('');update({...emptyGuideSearch});}
 const filtered=!!(state.country||state.time!=='any'||state.collections.length||state.interests.length||state.sort!=='relevance');
 return <div className="space-y-8 sm:space-y-10">
  <GuideSearchControls state={state} draft={draft} onDraft={setDraft} onChange={update} onSearch={choose} onComposition={setComposing} pending={pendingInput||active&&result.isFetching&&!result.isFetchingNextPage} error={result.isError} page={first}/>
  {!active?<>{filtered&&<Button variant="ghost" size="sm" onClick={clear}>Clear all</Button>}{catalogue.isError&&!catalogue.data?<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-6 text-sm"><p>Guides could not be loaded.</p><Button variant="outline" onClick={()=>void catalogue.refetch()}>Try again</Button></div>:catalogue.isPending?<GuideLoading/>:catalogue.data?.totalElements===0?<div className="rounded-2xl border border-dashed border-border bg-card/50 p-6"><h2 className="font-semibold">No published guides match these filters yet</h2><p className="mt-2 text-sm text-muted-foreground">Try another country, month or collection. Travelers’ published guides will appear here.</p></div>:<GuideShelves state={state}/>}</>:<div className="space-y-8 border-t border-border/60 pt-7">
   <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" aria-live="polite" className="text-sm text-muted-foreground">{pendingInput||result.isPending?'Searching guides…':first?`${first.matchingTotal} matching ${first.matchingTotal===1?'guide':'guides'} · ${first.relevantTotal} relevant`:'Search guides'}</p><Button variant="ghost" size="sm" onClick={clear}>Clear all</Button></div>
   {!valid?<p role="alert" className="rounded-2xl border border-border bg-card p-6 text-sm">Use up to 200 characters. Your search text has been preserved.</p>:pendingInput||result.isPending?<GuideLoading/>:result.isError&&!result.data?<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-6 text-sm"><p>{result.error.message}</p><Button variant="outline" onClick={()=>void result.refetch()}>Try again</Button></div>:<>
    {first?.matchingTotal===0&&first.relevantTotal===0?<section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">No matching or relevant guides found</h2><p className="mt-2 text-sm text-muted-foreground">Try a broader phrase or adjust your filters.</p></section>:<section aria-labelledby="matching-guides" className="space-y-5"><div><h2 id="matching-guides" className="text-xl font-semibold tracking-tight">Matching guides</h2><p className="mt-1 text-sm text-muted-foreground">Published guides matching your destination and travel interests.</p></div>{groups.matching.length?<GuideCards guides={groups.matching}/>:<div className="rounded-2xl border border-border bg-card p-6 text-sm"><p className="font-medium">No matching guides found.</p><p className="mt-1 text-muted-foreground">Try a broader phrase or adjust your filters.</p></div>}</section>}
    {first?.notice&&<p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{first.notice}</p>}
    {(first?.relevantTotal??0)>0&&<section aria-labelledby="relevant-guides" className="space-y-5 border-t border-border/60 pt-8"><div><h2 id="relevant-guides" className="text-xl font-semibold tracking-tight">Relevant guides</h2><p className="mt-1 text-sm text-muted-foreground">Broader alternatives connected to your search. Selected filters still apply.</p></div><GuideCards guides={groups.relevant}/></section>}
    {!!first?.suggestions.length&&<section className="space-y-3"><h2 className="text-sm font-medium">Explore another search</h2><div className="flex flex-wrap gap-2">{first.suggestions.map(text=><Button key={text} variant="outline" size="sm" onClick={()=>choose(text)}>{text}</Button>)}</div></section>}
    {(result.hasNextPage||result.isFetchNextPageError)&&<div className="space-y-2"><Button variant="outline" disabled={result.isFetchingNextPage} onClick={()=>void result.fetchNextPage()}>{result.isFetchingNextPage?'Loading…':result.isFetchNextPageError?'Retry loading guides':'Load more guides'}</Button>{result.isFetchNextPageError&&<p role="alert" className="text-xs text-destructive">More guides could not be loaded. Your current results are still here.</p>}</div>}
   </>}
  </div>}
 </div>;
}

