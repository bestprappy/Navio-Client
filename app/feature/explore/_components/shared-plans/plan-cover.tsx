"use client";
/* Live provider photos retain author/source credits and bypass image optimization. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { readPlace, safeExternalUrl } from "../../places/places-api";
import { GoogleAttribution } from "../../places/google-attribution";
import type { ExplorePlan } from "./explore-plans-api";
import { destinationPlanCover } from "./plan-cover.data";

export function planCoverReference(value?: string | null): string | null {
  if (!value || value.startsWith("MAPBOX:")) return null;
  const raw = value.startsWith("GOOGLE:") ? value.slice(7) : value;
  return /^[A-Za-z0-9_-]{10,256}$/.test(raw) ? raw : null;
}
type LiveCredit = { reference:string;src:string;authors:{displayName:string;uri?:string|null}[];source?:string };
/** Keep the previously loaded photo with its credit while a replacement loads. */
export function livePhotoLayers(source:string|undefined,loaded:string|null) {
  return {previous:loaded&&loaded!==source?loaded:null,currentVisible:loaded===source};
}
function LivePlanPhoto({ placeId,onReady,onFailure }: {placeId:string;onReady:(credit:LiveCredit)=>void;onFailure:()=>void}) {
  const [failedUrls,setFailedUrls]=useState<string[]>([]);
  const [loadedUrl,setLoadedUrl]=useState<string|null>(null);
  const query=useQuery({queryKey:["discovery-place",placeId],queryFn:({signal})=>readPlace(placeId,signal),staleTime:60_000,gcTime:0,retry:1,retryOnMount:false});
  const item=query.data;
  const photo=item?.photos.find(candidate=>safeExternalUrl(candidate.url)&&!failedUrls.includes(candidate.url));
  const legacy=safeExternalUrl(item?.place.photoUrl);
  const src=photo?.url??(legacy&&!failedUrls.includes(legacy)?legacy:undefined);
  const layers=livePhotoLayers(src,loadedUrl);
  return <>{layers.previous&&<img src={layers.previous} alt="" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" onError={()=>{setLoadedUrl(null);onFailure();}} />}
    {item&&src&&<img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
    className={cn("absolute inset-0 size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]",!layers.currentVisible&&"opacity-0")}
    onLoad={()=>{setLoadedUrl(src);onReady({reference:placeId,src,authors:photo?.attributions??item.photoAttributions,source:safeExternalUrl(photo?.googleMapsUri??item.photoGoogleMapsUri)});}}
    onError={()=>{setFailedUrls(old=>old.includes(src)?old:[...old,src]);setLoadedUrl(null);onFailure();}} />}</>;
}
export function PlanCover({plan,className,creditLayout="overlay",imageClassName,children,photoCredit}: {
  plan:ExplorePlan;className?:string;creditLayout?:"overlay"|"footer";imageClassName?:string;children?:ReactNode;photoCredit?:ReactNode;
}) {
  const frame=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(false);
  const [failedStored,setFailedStored]=useState<string|null>(null);
  const [loadedStored,setLoadedStored]=useState<string|null>(null);
  const [liveCredit,setLiveCredit]=useState<LiveCredit|null>(null);
  const stored=safeExternalUrl(plan.coverImageUrl);
  const destination=destinationPlanCover(plan);
  const reference=planCoverReference(plan.coverPlaceId);
  const onReady=useCallback((credit:LiveCredit)=>setLiveCredit(credit),[]);
  const onFailure=useCallback(()=>setLiveCredit(null),[]);
  useEffect(()=>{
    if(!frame.current)return;
    if(typeof IntersectionObserver==="undefined"){const timer=setTimeout(()=>setVisible(true),0);return()=>clearTimeout(timer);}
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:"200px"});
    observer.observe(frame.current);return()=>observer.disconnect();
  },[]);
  const needsLive=!stored||failedStored===stored;
  const currentLive=needsLive&&liveCredit?.reference===reference?liveCredit:null;
  const storedVisible=stored&&loadedStored===stored&&failedStored!==stored;
  let credits:ReactNode=null;
  if(photoCredit)credits=photoCredit;
  else if(currentLive)credits=<><span className="flex min-w-0 flex-wrap gap-x-2">{currentLive.authors.map((author,index)=>safeExternalUrl(author.uri)?<a key={`${author.displayName}:${index}`} href={safeExternalUrl(author.uri)} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">Photo: {author.displayName}</a>:<span key={`${author.displayName}:${index}`}>Photo: {author.displayName}</span>)}{currentLive.source&&<a href={currentLive.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">Source</a>}</span><span className="shrink-0 [&>div]:p-0"><GoogleAttribution /></span></>;
  else if(storedVisible)credits=creditLayout==="footer"?<span>Trip photo <a href={stored} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">Photo source</a></span>:null;
  else if(destination)credits=<><a href={destination.sourceUrl} target="_blank" rel="noreferrer" title={`${destination.subject} - ${destination.author}`} className="min-w-0 truncate underline-offset-2 hover:underline">Photo: {destination.author}</a><a href={destination.licenseUrl} target="_blank" rel="noreferrer" className="shrink-0 underline underline-offset-2">{destination.license}</a></>;
  const creditRow=credits?<div data-cover-credit={creditLayout} className={cn("flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 bg-background px-3 py-2 text-[10px] leading-4 text-muted-foreground",creditLayout==="overlay"&&"absolute inset-x-0 bottom-0 z-10 bg-background/95 py-1.5")}>{credits}</div>:null;
  return <div className={cn("relative isolate overflow-hidden bg-muted",className)}>
    <div data-cover-frame="" ref={frame} className={cn("relative overflow-hidden",creditLayout==="overlay"&&"absolute inset-0",imageClassName)}>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-primary/5 p-5 text-center"><MapPinned className="size-8 text-primary/45" /><span className="max-w-full truncate text-base font-medium text-foreground/65">{plan.destinationCity||plan.destinationCountry||"A new journey"}</span></div>
      {destination&&<img src={destination.src} alt={`Destination photo: ${destination.subject}`} width={960} height={600} decoding="async" style={{objectPosition:destination.objectPosition}} className="absolute inset-0 size-full object-cover" />}
      {stored&&failedStored!==stored&&<img src={stored} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" onLoad={()=>setLoadedStored(stored)} onError={()=>setFailedStored(stored)} />}
      {visible&&reference&&needsLive&&<LivePlanPhoto key={reference} placeId={reference} onReady={onReady} onFailure={onFailure} />}
      {creditLayout==="overlay"&&creditRow}{children}
    </div>{creditLayout==="footer"&&creditRow}
  </div>;
}
