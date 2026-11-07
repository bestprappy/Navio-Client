"use client";
import {useEffect,useRef} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {Bookmark} from "lucide-react";
import {useRequireAuth} from "@/hooks/use-require-auth";
import {useCommunityIdentity} from "./community-group-queries";
import {saveCommunityPost,recordCommunityVisit} from "../../saved/community-library-api";
import type {CommunityPost} from "./data";
import {COMMUNITY_PILL_CLASS} from "./community-post-actions";
import {cn} from "@/lib/utils";
export function CommunitySavePost({post,onRemoved}:{post:CommunityPost;onRemoved?:()=>void}){
 const {identity,authenticated}=useCommunityIdentity();const {requireAuth}=useRequireAuth();const client=useQueryClient();
 const key=["community",identity,"bookmark",post.id];
 const state=useQuery({queryKey:key,queryFn:()=>Boolean(post.saved),enabled:false});
 const mutation=useMutation({mutationKey:["community-bookmark",identity,post.id],mutationFn:(saved:boolean)=>saveCommunityPost(post.id,saved),
  onSuccess:async(_,saved)=>{client.setQueryData(key,saved);if(!saved)onRemoved?.();await Promise.all([client.invalidateQueries({queryKey:["community",identity],predicate:q=>q.queryKey[2]!=="bookmark"}),client.invalidateQueries({queryKey:["social","posts"]})]);}});
 const saved=authenticated&&(state.data??Boolean(post.saved));
 return <><button type="button" aria-label={saved?"Unsave post":"Save post"} title={saved?"Unsave post":"Save post"} aria-pressed={saved} disabled={mutation.isPending}
  className={cn(COMMUNITY_PILL_CLASS,"px-2.5",saved&&"bg-primary/10 text-primary")} onClick={()=>requireAuth(()=>mutation.mutate(!saved))}><Bookmark className="size-4" fill={saved?"currentColor":"none"}/></button>
  {mutation.error&&<span role="alert" className="basis-full text-xs text-destructive">{mutation.error.message}</span>}</>;
}
/** Only the mounted, readable thread records a visit; never feed cards or prefetches. */
export function useRecordCommunityVisit(id:string){
 const {identity,authenticated}=useCommunityIdentity();const sent=useRef("");const client=useQueryClient();
 useEffect(()=>{const key=`${identity}:${id}`;if(!authenticated||sent.current===key)return;sent.current=key;
  void recordCommunityVisit(id).then(()=>client.invalidateQueries({queryKey:["community",identity,"library","history"]})).catch(()=>{sent.current="";});
 },[identity,authenticated,id,client]);
}
