"use client";
import {useEffect,useId,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {Bookmark,BookOpen,Clock3,Compass,Filter,FolderHeart,RotateCcw,Search,Trash2,X} from 'lucide-react';
import {SourcePlanLink} from './source-plan-links';
import {ReaderStopPhoto} from '@/app/feature/planner/_components/share/reader/reader-ui';
import {SavedLayout} from './saved-layout';
import {Button} from '@/components/ui/button';
import {useRequireAuth} from '@/hooks/use-require-auth';
import {cn} from '@/lib/utils';
import {AddPlaceToPlan} from '@/app/feature/explore/places/plan-context';
import {PlanCover} from '@/app/feature/explore/_components/shared-plans/plan-cover';
import {CopySharedPlanButton} from '@/app/feature/explore/_components/shared-plans/copy-shared-plan-button';
import {savedPlanReference,suggestSaved,checkSource,libraryKey,listSaved,openSaved,purgeSaved,recentlyOpened,removeSaved,restoreSaved,type SavedItem} from './library-api';
import {clampSavedPage,parseSavedSearch,savedSearchParams,savedTabs,type SavedSearch} from './library-model';

const field='h-10 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const labels={recents:'Recents',all:'All',plans:'Plans',guides:'Guides',places:'Places',trash:'Recently Deleted'};
export function SavedPage(){
 const params=useSearchParams(),router=useRouter();const state=parseSavedSearch(params);const [draft,setDraft]=useState<string|null>(null);const [advanced,setAdvanced]=useState(false);
 const {isAuthenticated,isAuthenticationLoading,requireAuth}=useRequireAuth();const {data:session}=useSession();const client=useQueryClient();const user=session?.user?.id;
 const [notice,setNotice]=useState('');const [undo,setUndo]=useState<string|null>(null);
 const update=(next:Partial<SavedSearch>)=>{setDraft(null);router.replace(`/saved?${savedSearchParams({...state,...next,page:next.page??0})}`,{scroll:false});};
 const suggestionId=useId();const [suggestionText,setSuggestionText]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setSuggestionText(draft??''),250);return()=>clearTimeout(timer);},[draft]);
 const suggestions=useQuery({queryKey:[...libraryKey(user),'suggestions',suggestionText],queryFn:({signal})=>suggestSaved(suggestionText,signal),enabled:isAuthenticated&&state.tab!=='trash'&&suggestionText.trim().length>=2,staleTime:15000});
 const filtered=!!(state.search||state.country||state.city||state.source||state.category||state.savedAfter||state.openedAfter);
 const recents=state.tab==='recents'&&!filtered;
 const query=useQuery({queryKey:[...libraryKey(user),'items',state],queryFn:({signal})=>listSaved(state,signal),enabled:isAuthenticated&&state.tab!=='guides',staleTime:10000,retry:1});
 const opened=useQuery({queryKey:[...libraryKey(user),'opened'],queryFn:recentlyOpened,enabled:isAuthenticated&&recents,staleTime:10000,retry:1});
 const action=useMutation({mutationFn:async({kind,item}:{kind:'remove'|'restore'|'purge'|'open'|'source';item:SavedItem})=>{
   setNotice('');setUndo(null);
   if(kind==='remove'){await removeSaved(item.id);setUndo(item.id);return 'Moved to Recently Deleted. You can restore it for 7 days.';}
   if(kind==='restore'){await restoreSaved(item.id);return 'Restored to Saved.';}
   if(kind==='purge'){await purgeSaved(item.id);return 'Permanently removed from Saved.';}
   if(kind==='source'){await checkSource(item.id,item.sources[0].token);router.push(`/share/plans/${encodeURIComponent(item.sources[0].token)}`);return '';}
   await openSaved(item.id);
   if(item.type==='PLAN')router.push(`/share/plans/${encodeURIComponent(item.identity.slice(5))}`);
   else if(item.providerPlaceId&&!item.providerPlaceId.startsWith('MAPBOX:')&&!item.providerPlaceId.startsWith('ev-charger:'))router.push(`/explore/places/${encodeURIComponent(item.providerPlaceId.replace(/^GOOGLE:/i,''))}`);
   else window.location.assign(`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`);
   return '';
 },onSuccess:async message=>{setNotice(message);await client.invalidateQueries({queryKey:libraryKey(user)});},onError:e=>setNotice(e.message)});
 const rows=query.data?.items??[];
 useEffect(()=>{if(query.data&&!query.isFetching){const page=clampSavedPage(state.page,query.data.total);if(page!==state.page)router.replace(`/saved?${savedSearchParams({...state,page})}`,{scroll:false});}},[query.data,query.isFetching,state,router]);
 function grid(items:SavedItem[]){return <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><SavedCard key={item.id} item={item} trash={state.tab==='trash'} pending={action.isPending} onAction={kind=>action.mutate({kind,item})}/>)}</div>;}
 return <SavedLayout header={
  <header className="mb-7 flex items-start justify-between gap-5"><div><p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-widest text-primary uppercase"><FolderHeart className="size-4"/>Your travel collection</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Saved</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Places worth keeping. Plans worth coming back to.</p></div>{isAuthenticated&&query.data&&<div className="shrink-0 rounded-2xl border border-border/60 bg-card px-4 py-3 text-right text-xs leading-6 text-muted-foreground"><p>{query.data.plans} / 50 plans</p><p>{query.data.places} places</p></div>}</header>} navigation={
  <nav aria-label="Saved collections" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-x-visible">{savedTabs.map(tab=><button type="button" key={tab} aria-current={state.tab===tab?'page':undefined} onClick={()=>update({tab})} className={cn('min-h-10 shrink-0 rounded-full px-4 text-left text-sm transition-colors md:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',state.tab===tab?'bg-foreground text-background':'text-muted-foreground hover:bg-muted')}>{labels[tab]}{tab==='guides'&&<span className="ml-1.5 text-[10px] opacity-70">Later</span>}</button>)}<span className="flex shrink-0 items-center px-4 py-3 text-xs leading-5 text-muted-foreground/70 md:mt-2 md:border-t md:border-border/60" title="Custom categories are planned for later">Custom categories ? Later</span></nav>}>
  {state.tab==='guides'?<Empty icon="book" title="Guides will join your collection later." text="Your saved plans and places are ready to browse in the other collections."/>:<>
  <section aria-label="Search saved content" className="mb-7 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
   <form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();update({search:draft??state.search});}}>
    <label className="min-w-48 flex-1 text-xs font-medium">{state.tab==='trash'?'Search Recently Deleted':recents||state.tab==='recents'?'Search all saved content':`Search ${labels[state.tab].toLowerCase()}`}<span className="relative mt-2 block"><Search className="absolute top-3 left-3 size-4 text-muted-foreground"/><input type="search" list={suggestionId} maxLength={200} className={cn(field,'pl-9')} value={draft??state.search} placeholder="Name, destination, author or place type" onChange={e=>setDraft(e.target.value)}/></span></label>
    <Button type="submit" className="h-10 rounded-xl">Search</Button>
    <Button type="button" variant="outline" className="h-10 rounded-xl" aria-expanded={advanced} aria-controls="saved-filters" onClick={()=>setAdvanced(!advanced)}><Filter className="size-4"/>Filters{filtered&&<span className="size-1.5 rounded-full bg-primary"/>}</Button>
    <label className="text-xs font-medium">Sort by<select className={cn(field,'mt-2 w-auto')} value={state.sort} onChange={e=>update({sort:e.target.value as SavedSearch['sort']})}><option value="NEWEST">Newest saved</option><option value="OLDEST">Oldest saved</option><option value="NAME">Name</option><option value="OPENED">Recently opened</option></select></label>
   </form><datalist id={suggestionId}>{suggestions.data?.items.map(item=><option key={item.id} value={item.name}>{[item.city,item.country].filter(Boolean).join(", ")}</option>)}</datalist>
   {advanced&&<div id="saved-filters" className="mt-5 grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2 lg:grid-cols-3">
    {(['country','city','category'] as const).map(key=><label key={key} className="text-xs font-medium">{{country:'Countries',city:'Cities',category:'Place types'}[key]}<input className={cn(field,'mt-2')} defaultValue={state[key]} key={`${key}:${state[key]}`} placeholder="Any · separate choices with commas" onBlur={e=>{if(e.target.value!==state[key])update({[key]:e.target.value});}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>)}
    <label className="text-xs font-medium">Saved from<select className={cn(field,'mt-2')} value={state.source} onChange={e=>update({source:e.target.value})}><option value="">Anywhere</option><option value="DIRECT">Places & personal favorites</option><option value="SHARED_PLAN">Shared plans</option></select></label>
    {(['savedAfter','openedAfter'] as const).map(key=><label key={key} className="text-xs font-medium">{key==='savedAfter'?'Saved since':'Opened since'}<input type="date" className={cn(field,'mt-2')} value={state[key]} onChange={e=>update({[key]:e.target.value})}/></label>)}
    <p className="text-[11px] leading-5 text-muted-foreground sm:col-span-2 lg:col-span-3">Choices within a field match any choice. Different fields work together. Search covers your entire collection.</p>
   </div>}
   {filtered&&<div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">{(['search','country','city','category','source','savedAfter','openedAfter'] as const).filter(k=>state[k]).map(k=><button key={k} type="button" onClick={()=>update({[k]:''})} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs" aria-label={`Remove ${k} filter`}>{k==='search'?'Search':k.replace('After',' since')}: {state[k]}<X className="size-3"/></button>)}<button type="button" className="px-2 text-xs font-medium text-primary" onClick={()=>update({search:'',country:'',city:'',category:'',source:'',savedAfter:'',openedAfter:''})}>Clear all</button></div>}
  </section>
  {state.tab==='trash'&&<p className="mb-5 text-sm leading-6 text-muted-foreground">Removed items stay here for 7 days. They do not count toward your saved-plan limit. Deleting a bookmark never removes it from a trip.</p>}
  {notice&&<div role={action.isError?'alert':'status'} className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">{notice}{undo&&<button type="button" className="font-semibold text-primary underline" onClick={()=>action.mutate({kind:'restore',item:{id:undo} as SavedItem})}>Undo</button>}<button type="button" aria-label="Dismiss message" className="ml-auto" onClick={()=>setNotice('')}><X className="size-4"/></button></div>}
  {isAuthenticationLoading?<p role="status">Loading your collection…</p>:!isAuthenticated?<Empty title="Keep your next journey close." text="Sign in to save places and plans, and find them again on any device." action={<Button onClick={()=>requireAuth(()=>{})}>Sign in</Button>}/>:query.isError?<Empty title="Your collection could not be loaded." text={query.error.message} action={<Button variant="outline" onClick={()=>query.refetch()}>Try again</Button>}/>:query.isPending?<div role="status" className="grid gap-4 sm:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-64 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"/>)}<span className="sr-only">Loading saved content</span></div>:<>
  <section aria-labelledby="saved-results-title"><div className="mb-4 flex items-baseline justify-between gap-4"><h2 id="saved-results-title" className="text-xl font-semibold tracking-tight">{recents?'Recently saved':state.tab==='recents'?'Search results':labels[state.tab]}</h2>{recents?<button type="button" className="text-sm text-primary" onClick={()=>update({tab:'all'})}>View all</button>:<p className="text-xs text-muted-foreground">{query.data?.total??0} {(query.data?.total??0)===1?'item':'items'}</p>}</div>
   {rows.length?grid(recents?rows.slice(0,6):rows):<Empty title={filtered?'No matches in your collection.':state.tab==='trash'?'Nothing in Recently Deleted.':'Your collection starts here.'} text={filtered?'Try fewer filters or a different name.':'Save a place or shared plan while exploring, and find it here.'} action={!filtered&&state.tab!=='trash'?<Button variant="outline" onClick={()=>router.push('/explore')}>Explore</Button>:undefined}/>}
  </section>
  {!recents&&(query.data?.total??0)>24&&<div className="mt-7 flex items-center justify-center gap-4"><Button variant="outline" disabled={state.page===0} onClick={()=>update({page:state.page-1})}>Previous</Button><span className="text-sm text-muted-foreground">Page {state.page+1} of {Math.ceil((query.data?.total??0)/24)}</span><Button variant="outline" disabled={(state.page+1)*24>=(query.data?.total??0)} onClick={()=>update({page:state.page+1})}>Next</Button></div>}
  {recents&&<section className="mt-10 border-t border-border/60 pt-8" aria-labelledby="recently-opened-title"><h2 id="recently-opened-title" className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight"><Clock3 className="size-5 text-muted-foreground"/>Recently opened</h2>{opened.isPending?<p role="status" className="text-sm text-muted-foreground">Loading recently opened…</p>:opened.isError?<button type="button" onClick={()=>opened.refetch()} className="text-sm text-primary">Could not load recently opened. Retry</button>:opened.data?.items.length?grid(opened.data.items):<p className="rounded-2xl bg-muted/50 p-5 text-sm leading-6 text-muted-foreground">Places and plans you open from Saved appear here.</p>}</section>}
  </>}
  </>}
 </SavedLayout>;
}
function Empty({title,text,action,icon}:{title:string;text:string;action?:React.ReactNode;icon?:'book'}){return <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">{icon==='book'?<BookOpen className="mx-auto mb-3 size-6 text-primary"/>:<Bookmark className="mx-auto mb-3 size-6 text-primary"/>}<h3 className="font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{text}</p>{action&&<div className="mt-5">{action}</div>}</div>;}
type Action='remove'|'restore'|'purge'|'open'|'source';
function SavedCard({item,trash,pending,onAction}:{item:SavedItem;trash:boolean;pending:boolean;onAction:(kind:Action)=>void}){
 const plan=item.type==='PLAN';const provider=item.providerPlaceId?.replace(/^GOOGLE:/i,'');
 const location=[item.city,item.country].filter(Boolean).join(', ')||item.address;
 const [confirm,setConfirm]=useState(false);const [now]=useState(()=>Date.now());
 return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-shadow hover:shadow-sm">
  {plan?<div className="relative"><PlanCover plan={{token:item.identity.slice(5),title:item.name,authorName:item.authorName,destinationCity:item.city,destinationCountry:item.country,dayCount:item.dayCount??0,placeCount:0,chargerCount:0,coverImageUrl:null,highlights:[],days:[]}} imageClassName="h-32"/></div>:<div className="flex items-center gap-3 border-b border-border/40 bg-muted/35 px-5 py-4"><ReaderStopPhoto item={{type:"place",placeId:item.providerPlaceId??undefined,name:item.name}} className="size-16 shrink-0 rounded-xl"/><span className="text-xs font-medium text-muted-foreground">{item.category||'Saved place'}</span></div>}
  <div className="flex flex-1 flex-col p-5"><p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{plan?'Shared plan':'Place'}</p><h3 className="mt-1 text-lg font-semibold leading-6 tracking-tight">{item.name}</h3>{location&&<p className="mt-2 text-xs leading-5 text-muted-foreground">{location}</p>}{plan&&<p className="mt-2 text-xs text-muted-foreground">{item.dayCount} days{item.authorName&&` · ${item.authorName}`}</p>}
   <p className="mt-3 text-[11px] text-muted-foreground">{trash?`Removed ${new Date(item.deletedAt!).toLocaleDateString()} · ${Math.max(0,7-Math.floor((now-Date.parse(item.deletedAt!))/86400000))} days left`:`Saved ${new Date(item.savedAt).toLocaleDateString()}`}</p>
   <div className="mt-auto pt-5"><div className="flex items-center gap-2">{trash?<><Button variant="outline" size="sm" disabled={pending} onClick={()=>onAction('restore')} className="flex-1"><RotateCcw className="size-3.5"/>Restore</Button><Button variant="ghost" size="icon-sm" title="Permanently delete" aria-label={`Permanently delete ${item.name}`} onClick={()=>setConfirm(true)}><Trash2 className="size-4"/></Button></>:<><Button variant="outline" size="sm" className="flex-1" disabled={pending} onClick={()=>onAction('open')}><Compass className="size-3.5"/>Open</Button><Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Remove ${item.name} from Saved`} title="Remove from Saved" onClick={()=>onAction('remove')}><Bookmark className="size-4 fill-current text-primary"/></Button></>}</div>
    {!trash&&<div className="mt-3">{plan?<CopySharedPlanButton token={item.identity.slice(5)} loadPublishedStartDate={async()=>(await savedPlanReference(item.id)).startDate??undefined}/>:item.lat!=null&&item.lng!=null?<AddPlaceToPlan placeId={provider??`SAVED:${item.id}`} savedLocation={{name:item.name,address:item.address,lat:item.lat,lng:item.lng}}/>:null}</div>}
    {!trash&&item.sources.length>0&&<div className="mt-3 flex flex-wrap gap-2">{item.sources.map(source=><SourcePlanLink key={source.token} id={item.id} token={source.token} title={source.title} multiple={item.sources.length>1}/>)}</div>}
    {confirm&&<div role="alert" className="mt-3 rounded-xl bg-muted p-3 text-xs leading-5">Permanently remove this bookmark? This cannot be undone.<div className="mt-2 flex gap-3"><button type="button" disabled={pending} className="font-semibold text-destructive" onClick={()=>onAction('purge')}>Delete permanently</button><button type="button" onClick={()=>setConfirm(false)}>Cancel</button></div></div>}
   </div>
  </div>
 </article>;
}
