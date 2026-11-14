"use client";
import {useEffect,useRef,useState} from 'react';
type ReadState={id:string;identities:Set<string>};
/** A visible opening owns one read ID; signing in attaches an account to that same read. */
export function usePublicationRead({url,identity,loading,onRecorded}:{url?:string;identity:string;loading:boolean;onRecorded:()=>Promise<unknown>}){
 const read=useRef<{url:string;state:ReadState}|null>(null),callback=useRef(onRecorded);
 const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{callback.current=onRecorded;},[onRecorded]);
 useEffect(()=>{
  if(!url||loading)return;
  const record=()=>{
   if(document.visibilityState!=='visible')return;
   if(read.current?.url!==url)read.current={url,state:{id:crypto.randomUUID(),identities:new Set()}};
   const state=read.current.state;
   if(state.identities.has(identity))return;
   state.identities.add(identity);const current=state;
   void fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({readId:state.id}),keepalive:true})
    .then(async response=>{if(!response.ok)throw new Error('View not recorded');await callback.current();setFailed(false);})
    .catch(()=>{current.identities.delete(identity);setFailed(true);});
  };
  record();document.addEventListener('visibilitychange',record);
  return()=>document.removeEventListener('visibilitychange',record);
 },[url,identity,loading,attempt]);
 return {failed,retry:()=>setAttempt(value=>value+1)};
}
