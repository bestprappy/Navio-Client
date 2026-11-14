"use client";
import {useQuery} from '@tanstack/react-query';
import {Bookmark} from 'lucide-react';
import {z} from 'zod';
export const favoritesKey=['public-favorites'] as const;
const countsSchema=z.array(z.object({identity:z.string(),count:z.number().int().nonnegative()}));
type Waiter={resolve:(count:number)=>void;reject:(error:unknown)=>void};
let queued=new Map<string,Waiter[]>();
// Batch repeated landing cards without fetching any private bookmark records.
export function batchedFavoriteCount(identity:string):Promise<number>{return new Promise((resolve,reject)=>{
 const first=queued.size===0;
 const waiters=queued.get(identity)??[];waiters.push({resolve,reject});queued.set(identity,waiters);
 if(first)setTimeout(()=>{const entries=[...queued];queued=new Map();for(let i=0;i<entries.length;i+=48){const batch=entries.slice(i,i+48);const params=new URLSearchParams();for(const [id] of batch)params.append('identity',id);
  void fetch(`/api/saved-content/favorites?${params}`,{cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async response=>{if(!response.ok)throw new Error('Favorites unavailable');return countsSchema.parse(await response.json());}).then(counts=>{for(const [id,list] of batch){const value=counts.find(row=>row.identity===id);for(const waiter of list){if(value)waiter.resolve(value.count);else waiter.reject(new Error('Incomplete favorite counts'));}}},error=>{for(const [,list] of batch)for(const waiter of list)waiter.reject(error);});
 }},0);
});}
export function useFavoriteCount(identity?:string){return useQuery({queryKey:[...favoritesKey,identity],enabled:!!identity,queryFn:()=>batchedFavoriteCount(identity!),staleTime:30000,retry:1});}
export function FavoriteCount({identity}:{identity:string}){const {data}=useFavoriteCount(identity);return <span className="inline-flex min-w-0 items-center gap-1.5" title="Accounts that currently have this item saved"><Bookmark className="size-3.5 shrink-0" aria-hidden="true"/><span>{data===undefined?'\u2014':data.toLocaleString()} current favorites</span></span>;}
