"use client";
import {useEffect,useRef,useState} from 'react';
import {Bookmark,LoaderCircle} from 'lucide-react';
import {useSession} from 'next-auth/react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useRequireAuth} from '@/hooks/use-require-auth';
import {cn} from '@/lib/utils';
import {batchedBookmarkState,libraryKey,openSaved,removeSaved,restoreSaved,saveLocation,savePlan} from './library-api';
import {locationBookmark,placeIdentity,type BookmarkLocation} from './library-model';

type Props={place?:BookmarkLocation;token?:string;sourceToken?:string;className?:string;trackOpen?:boolean};
export function SaveButton({place,token,sourceToken,className,trackOpen=false}:Props){
 const {data:session}=useSession();const {requireAuth,isAuthenticated,isAuthenticationLoading}=useRequireAuth();const client=useQueryClient();
 const [message,setMessage]=useState('');const [undoId,setUndoId]=useState<string|null>(null);
 const [attempted,setAttempted]=useState(false);
 const user=session?.user?.id;
 const identity=place?placeIdentity(place.providerPlaceId,place.location.lat,place.location.lng):`plan:${token}`;
 const key=[...libraryKey(user),'state',identity];
 const state=useQuery({queryKey:key,queryFn:()=>batchedBookmarkState(user!,identity),enabled:isAuthenticated&&!!user&&(!!place||!!token),staleTime:30000,retry:1});
 const openedId=useRef<string|null>(null);
 const savedId=isAuthenticated?state.data?.id:null;
 useEffect(()=>{if(trackOpen&&savedId&&openedId.current!==savedId){openedId.current=savedId;void openSaved(savedId).then(()=>{void client.invalidateQueries({queryKey:[...libraryKey(user),'opened']});void client.invalidateQueries({queryKey:[...libraryKey(user),'items']});}).catch(()=>{});}},[trackOpen,savedId,client,user]);
 const needsSource=!!sourceToken&&state.data?.saved&&!state.data.sources.some(s=>s.token===sourceToken);
 const mutation=useMutation({mutationFn:async()=>{
   setMessage('');setUndoId(null);
   if(state.data?.saved&&!needsSource){await removeSaved(state.data.id!);setUndoId(state.data.id);return 'Moved to Recently Deleted.';}
   if(place)await saveLocation(locationBookmark(place,sourceToken));else if(token)await savePlan(token);
   return needsSource?'Saved. Source plan added.':'Saved to your collection.';
 },onSuccess:async text=>{setMessage(text);await client.invalidateQueries({queryKey:libraryKey(user)});},onError:e=>setMessage(e instanceof Error?e.message:'Could not save. Please try again.')});
 const undo=useMutation({mutationFn:()=>restoreSaved(undoId!),onSuccess:async()=>{setUndoId(null);setMessage('Restored.');await client.invalidateQueries({queryKey:libraryKey(user)});},onError:e=>setMessage(e.message)});
 const label=needsSource?'Add this plan as a source':state.data?.saved?`Remove saved ${place?'place':'plan'}`:`Save ${place?'place':'plan'}`;
 const pending=mutation.isPending||undo.isPending;
 return <span className="relative inline-flex shrink-0">
  <button type="button" title={state.isError?'Saved status unavailable. Click to retry.':label} aria-label={label} aria-pressed={state.data?.saved??false}
   disabled={pending||isAuthenticationLoading||(isAuthenticated&&state.isPending)||(!place&&!token)}
   onClick={()=>requireAuth(()=>{setAttempted(true);if(state.isError)void state.refetch();else mutation.mutate();})}
   className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',state.data?.saved&&'border-primary/30 bg-primary/10 text-primary',className)}>
   {pending?<LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true"/>:<Bookmark className={cn('size-4',state.data?.saved&&'fill-current')} aria-hidden="true"/>}
  </button>
  {(message||(attempted&&state.isError))&&<span role={mutation.isError||state.isError?'alert':'status'} className="absolute bottom-full right-0 z-40 mb-2 w-56 rounded-xl border border-border bg-card p-3 text-xs leading-5 text-foreground shadow-lg">
   {message||(state.error instanceof Error?state.error.message:'Saved status unavailable.')}
   {undoId&&<button type="button" onClick={()=>undo.mutate()} disabled={pending} className="ml-2 font-semibold text-primary underline">Undo</button>}
   {message&&<button type="button" aria-label="Dismiss saved message" className="ml-2 underline text-muted-foreground" onClick={()=>setMessage('')}>Dismiss</button>}
  </span>}
 </span>;
}
