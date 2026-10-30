"use client";
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useMutation,useQuery} from '@tanstack/react-query';
import {ExternalLink} from 'lucide-react';
import {useRequireAuth} from '@/hooks/use-require-auth';
import {batchedBookmarkState,checkSource,libraryKey} from './library-api';
import {placeIdentity,type BookmarkLocation} from './library-model';
export function SourcePlanLink({id,token,title,multiple=false}:{id:string;token:string;title:string;multiple?:boolean}){
 const router=useRouter();const action=useMutation({mutationFn:()=>checkSource(id,token),onSuccess:()=>router.push(`/share/plans/${encodeURIComponent(token)}`)});
 return <span><button type="button" disabled={action.isPending} title={title} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={()=>action.mutate()}>Go to Plan{multiple?`: ${title}`:''}<ExternalLink className="size-3" aria-hidden="true"/></button>{action.isError&&<p role="alert" className="mt-1 text-xs text-muted-foreground">This source plan is unavailable. Your saved place is still here.</p>}</span>;
}
export function SavedPlaceSources({place}:{place:BookmarkLocation}){
 const {data:session}=useSession();const {isAuthenticated}=useRequireAuth();const user=session?.user?.id;
 const identity=placeIdentity(place.providerPlaceId,place.location.lat,place.location.lng);
 const query=useQuery({queryKey:[...libraryKey(user),'state',identity],queryFn:()=>batchedBookmarkState(user!,identity),enabled:isAuthenticated&&!!user,staleTime:30000,retry:1});
 return <div className="flex min-h-4 flex-wrap gap-x-3 gap-y-2">{isAuthenticated&&query.data?.id&&query.data.sources.map(source=><SourcePlanLink key={source.token} id={query.data!.id!} token={source.token} title={source.title} multiple={query.data!.sources.length>1}/>)}</div>;
}
