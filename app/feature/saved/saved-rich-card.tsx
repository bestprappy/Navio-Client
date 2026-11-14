"use client";
import type {MouseEvent,ReactNode} from "react";
import {useQuery} from "@tanstack/react-query";
import {SharedPlanCard} from "../explore/_components/shared-plans/shared-plan-card";
import {TravelerGuideCard} from "../guides/guide-card";
import {PlaceCard} from "../explore/places/places-discovery";
import {usePlaceDetails} from "../planner/planId/_components/place/use-place-details";
import {ReaderStopPhoto} from "../planner/_components/share/reader/reader-ui";
import {AddPlaceToPlan} from "../explore/places/plan-context";
import {Bookmark} from "lucide-react";
import {SourcePlanLink} from "./source-plan-links";
import {loadSavedPublication} from "./saved-card-data";
import {savedPlanReference,type SavedItem} from "./library-api";
import {CopySharedPlanButton} from "../explore/_components/shared-plans/copy-shared-plan-button";
import type {DiscoveryItem} from "../explore/places/places-api";

export function SavedRichCard({item,fallback,onOpen,onRemove,pending}:{item:SavedItem;fallback:ReactNode;onOpen:()=>void;onRemove:()=>void;pending:boolean}){
 const query=useQuery({queryKey:["saved-publication",item.identity],queryFn:({signal})=>loadSavedPublication(item,signal),enabled:item.type!=="PLACE",staleTime:60000,retry:1});
 function open(event:MouseEvent<HTMLDivElement>){
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=(event.target as HTMLElement).closest('a');
  if(link&&/^\/explore\/(shared|guides|places)\//.test(link.getAttribute('href')??'')){event.preventDefault();onOpen();}
 }
 const saveAction=<button type="button" disabled={pending} aria-label={`Remove ${item.name} from Saved`} title="Remove from Saved" aria-pressed="true" onClick={onRemove} className="relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><Bookmark className="size-4 fill-current" aria-hidden="true"/></button>;
 let card:ReactNode;
 if(item.type==="PLACE")card=<SavedPlaceCard item={item} saveAction={saveAction}/>;
 else if(query.isPending)return <div role="status" aria-label={`Loading ${item.name}`} className="h-96 animate-pulse rounded-2xl border border-border/60 bg-muted motion-reduce:animate-none"/>;
 else if(query.isError||!query.data)return <div className="space-y-2">{fallback}{query.isError&&<button type="button" className="text-xs text-primary underline" onClick={()=>void query.refetch()}>Retry full card</button>}</div>;
 else card=query.data.kind==="plan"?<SharedPlanCard plan={query.data.plan} saveAction={saveAction}/>:<TravelerGuideCard guide={query.data.guide} layout="discovery" saveAction={saveAction}/>;
 return <div className="flex min-w-0 flex-col gap-2" onClickCapture={event=>{if(item.type==='PLACE'&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&(event.target as HTMLElement).closest('a[data-saved-reader]')){event.preventDefault();onOpen();}else open(event);}}>{card}{item.type==='PLAN'&&<div><CopySharedPlanButton token={item.identity.slice(5)} loadPublishedStartDate={async()=>(await savedPlanReference(item.id)).startDate??undefined}/></div>}<p className="px-1 text-xs text-muted-foreground">Saved {new Date(item.savedAt).toLocaleDateString()}</p></div>;
}

function SavedPlaceCard({item,saveAction}:{item:SavedItem;saveAction:ReactNode}){
 const details=usePlaceDetails(item.providerPlaceId??"",{enabled:false});
  const place={providerPlaceId:item.providerPlaceId??`SAVED:${item.id}`,name:item.name,address:item.address,location:{lat:item.lat??0,lng:item.lng??0},category:item.category};
  const entry:DiscoveryItem={place:{...place,name:details.data?.name??place.name,address:details.data?.address||place.address,category:details.data?.category??place.category,rating:details.data?.rating,reviewCount:details.data?.reviewCount},photos:[],photoAttributions:[]};
  const href=item.providerPlaceId&&!/^(MAPBOX:|ev-charger:)/i.test(item.providerPlaceId)?`/explore/places/${encodeURIComponent(item.providerPlaceId.replace(/^GOOGLE:/i,''))}`:`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
  return <PlaceCard item={entry} context="" href={href} media={<ReaderStopPhoto item={{type:"place",placeId:item.providerPlaceId??undefined,name:item.name}} className="absolute inset-0 size-full"/>} actions={<><div className="flex items-center gap-3 border-t border-border/50 pt-3"><div className="min-w-0 flex-1">{item.lat!=null&&item.lng!=null&&<AddPlaceToPlan placeId={place.providerPlaceId} savedLocation={{name:item.name,address:item.address,lat:item.lat,lng:item.lng}}/>}</div>{saveAction}</div><div className="flex flex-wrap gap-2">{item.sources.map(source=><SourcePlanLink key={source.token} id={item.id} token={source.token} title={source.title} multiple={item.sources.length>1}/>)}</div></>}/>;

}
