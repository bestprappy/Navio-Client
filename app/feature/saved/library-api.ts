import {z} from 'zod';
import type {locationBookmark,SavedSearch} from './library-model';
const sourceSchema=z.object({token:z.string(),title:z.string()});
export const savedItemSchema=z.object({id:z.string().uuid(),type:z.enum(['PLACE','PLAN']),identity:z.string(),name:z.string(),address:z.string().nullable(),providerPlaceId:z.string().nullable(),lat:z.number().nullable(),lng:z.number().nullable(),country:z.string().nullable(),city:z.string().nullable(),category:z.string().nullable(),authorName:z.string().nullable(),dayCount:z.number().nullable(),savedAt:z.string(),openedAt:z.string().nullable(),deletedAt:z.string().nullable(),sources:z.array(sourceSchema)});
export type SavedItem=z.infer<typeof savedItemSchema>;
const resultsSchema=z.object({items:z.array(savedItemSchema),total:z.number(),page:z.number(),size:z.number(),plans:z.number(),places:z.number()});
const stateSchema=z.object({identity:z.string(),id:z.string().uuid().nullable(),saved:z.boolean(),sources:z.array(sourceSchema)});
export type BookmarkState=z.infer<typeof stateSchema>;
export const libraryKey=(user:string|undefined)=>['saved-library',user??'signed-out'] as const;
async function request(path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<unknown>{
 const r=await fetch(`/api/users/me/saved${path}`,{method,body:body===undefined?undefined:JSON.stringify(body),headers:{'Content-Type':'application/json'},cache:'no-store',signal:signal??AbortSignal.timeout(15000)});
 if(!r.ok){let message='Saved content could not be loaded. Please try again.';try{const b=await r.json();if(typeof b.message==='string')message=b.message;}catch{}if(r.status===401)message='Please sign in again to use Saved.';throw new Error(message);}
 if(r.status===204)return null;return r.json().catch(()=>null);
}
export async function listSaved(s:SavedSearch,signal?:AbortSignal){
 const p=new URLSearchParams({tab:s.tab==='trash'?'TRASH':s.tab==='plans'?'PLAN':s.tab==='places'?'PLACE':'ALL',search:s.search,sort:s.sort,page:String(s.page),size:'24'});
 for(const k of ['country','city','source','category'] as const)if(s[k])p.set(k,s[k]);
 for(const k of ['savedAfter','openedAfter'] as const)if(s[k])p.set(k,new Date(s[k]).toISOString());
 return resultsSchema.parse(await request(`?${p}`, 'GET',undefined,signal));
}
export async function recentlyOpened(){return resultsSchema.parse(await request('?tab=OPENED&sort=OPENED&size=8'));}
export async function bookmarkStates(identities:string[]){return z.array(stateSchema).parse(await request('/states','POST',{identities}));}
export async function saveLocation(place:ReturnType<typeof locationBookmark>){return savedItemSchema.parse(await request('/places','POST',place));}
export async function savePlan(token:string){return savedItemSchema.parse(await request('/plans','POST',{token}));}
export async function removeSaved(id:string){await request(`/${id}`,'DELETE');}
export async function restoreSaved(id:string){return savedItemSchema.parse(await request(`/${id}/restore`,'POST'));}
export async function purgeSaved(id:string){await request(`/${id}/permanent`,'DELETE');}
export async function openSaved(id:string){return savedItemSchema.parse(await request(`/${id}/open`,'POST'));}
export async function checkSource(id:string,token:string){await request(`/${id}/sources/${encodeURIComponent(token)}`);}
export async function savedPlanReference(id:string){return z.object({startDate:z.string().nullable()}).parse(await request(`/${id}/reference`));}
export async function suggestSaved(search:string,signal?:AbortSignal){return resultsSchema.parse(await request(`?search=${encodeURIComponent(search)}&size=8`,'GET',undefined,signal));}

// Coalesce cards mounted in the same frame; no account state is stored in this queue.
const queues=new Map<string,Map<string,{resolve:(v:BookmarkState)=>void;reject:(e:unknown)=>void}[]>>();
export function batchedBookmarkState(user:string,identity:string):Promise<BookmarkState>{return new Promise((resolve,reject)=>{
 let queue=queues.get(user);if(!queue){queue=new Map();queues.set(user,queue);setTimeout(()=>{queues.delete(user);const entries=[...queue!.entries()];for(let i=0;i<entries.length;i+=48){const batch=entries.slice(i,i+48);void bookmarkStates(batch.map(([key])=>key)).then(states=>{for(const [key,waiters] of batch){const state=states.find(s=>s.identity===key);for(const waiter of waiters){if(state)waiter.resolve(state);else waiter.reject(new Error('Saved state is incomplete.'));}}},error=>{for(const [,waiters] of batch)for(const waiter of waiters)waiter.reject(error);});}},0);}
 const waiters=queue.get(identity)??[];waiters.push({resolve,reject});queue.set(identity,waiters);
});}
