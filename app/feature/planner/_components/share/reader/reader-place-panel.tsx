"use client";
/* eslint-disable @next/next/no-img-element */
import {SaveButton} from "@/app/feature/saved/save-button";
import { useId, useState, type ReactNode } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin, Maximize2, Navigation, Phone, Star, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { safeExternalUrl } from "@/app/feature/explore/places/places-api";
import { GoogleAttribution } from "@/app/feature/explore/places/google-attribution";
import type { PublicItem } from "../publication-api";
import { plannerMobileViewAtom } from "../../../planId/_components/layout/planner-workspace";
import { readerSourceTokenAtom, readerActionAtom, readerModelAtom } from "./reader-state";
import { ReaderNotes, ReaderStopPhoto, readerButton, readerIconButton, useReaderPlace } from "./reader-ui";
import type { ReaderStop } from "./reader-model";

export function ReaderPlacePanel({ stop, reveal }: { stop: ReaderStop; reveal: (id: string) => void }) {
  const model = useAtomValue(readerModelAtom)!;
  const sourceToken=useAtomValue(readerSourceTokenAtom)??undefined;
  const action = useSetAtom(readerActionAtom);
  const setMobileView = useSetAtom(plannerMobileViewAtom);
  const group = model.groups.find(g => g.id === stop.groupId)!;
  const index = group.stops.findIndex(s => s.id === stop.id);
  const item = stop.item;
  const occurrences = model.groups.flatMap(g => g.stops.filter(s => s.item.placeId && s.item.placeId === item.placeId).map(s => ({ group:g,stop:s })));
  return <ReaderLocationPanel item={item} located={stop.located} index={index} total={group.stops.length} groupLabel={group.label}
    sourceToken={sourceToken} onPrevious={() => action({type:"step",direction:-1})} onNext={() => action({type:"step",direction:1})}
    onZoom={() => action({type:"zoom"})} onClose={() => action({type:"dismiss"})}
    onReveal={() => {reveal(stop.id);setMobileView("itinerary");}} revealLabel="View in itinerary" contextLabel="In this plan"
    context={<><h3 className="font-semibold">{group.label} · Stop {stop.number}</h3><ReaderNotes value={item.notes} label="Owner’s note" />
      {!item.notes && <p className="text-xs text-muted-foreground">The owner hasn’t shared a note for this stop.</p>}
      <div className="flex flex-wrap gap-2">{occurrences.map(o=><button type="button" key={o.stop.id} className={cn(readerButton,"min-h-8 px-3 text-xs")} onClick={()=>{action({type:"select",stopId:o.stop.id});reveal(o.stop.id);}}>{o.group.label} · Stop {o.stop.number}</button>)}</div></>} />;
}

/** Shared reader presentation; each reader supplies its own navigation and authored context. */
export function ReaderLocationPanel({item,located,index,total,groupLabel,sourceToken,onPrevious,onNext,onZoom,onClose,onReveal,revealLabel,contextLabel,context,category}: {
  item: PublicItem; located: boolean; index: number; total: number; groupLabel: string; sourceToken?: string; category?: string;
  onPrevious: () => void; onNext: () => void; onZoom: () => void; onClose: () => void; onReveal: () => void;
  revealLabel: string; contextLabel: "In this plan" | "In this guide"; context: ReactNode;
}) {
  const TABS = ["Overview", "Photos", "Reviews", contextLabel] as const;
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
  const panelId = useId();
  const query = useReaderPlace(item, true, !safeExternalUrl(item.imageUrl));
  const live = query.data?.place;
  const name = live?.name ?? item.name ?? "Planned stop";
  const address = live?.address ?? item.address;
  const description = live?.description ?? item.description;
  const rating = live?.rating ?? item.rating;
  const reviews = live?.reviewCount ?? item.reviewCount;
  const hours = item.charger?.openingHoursSummary ?? live?.openingHours?.summary;
  const weekdays = live?.openingHours?.weekdayDescriptions;
  const phone = live?.phone;
  const website = safeExternalUrl(live?.website);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(located ? `${item.lat},${item.lng}` : [name,address].filter(Boolean).join(" "))}`;
  const directions = located ? `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}` : null;
  const photos = (query.data?.photos ?? []).filter(p => safeExternalUrl(p.url) && !failedPhotos.includes(p.url));
  const selectedPhoto = photos[Math.min(photoIndex, Math.max(0, photos.length - 1))];
  const detailBody = <div className="space-y-4">
    {description && <p className="text-sm leading-7 text-muted-foreground">{description}</p>}
    {weekdays?.length ? <div><h3 className="mb-2 font-medium">Opening hours</h3><ul className="space-y-2 text-sm text-muted-foreground">{weekdays.map((day,index) => <li key={index}>{day}</li>)}</ul></div> : hours && <p className="text-sm">{hours}</p>}
    <ReaderNotes value={item.notes} label="Owner’s note" />
    {item.charger?.connectorTypes?.length ? <p className="text-sm">Connectors: {item.charger.connectorTypes.join(", ")}</p> : null}
  </div>;
  return <aside aria-label={`Place details: ${name}`} className="absolute inset-x-3 bottom-8 z-20 flex max-h-[calc(50%-1rem)] flex-col @lg/planner:inset-x-4">
    <div className="mb-2 flex min-w-0 shrink-0 items-center justify-between gap-2">
      <div className="flex items-center gap-2"><div className="flex items-center rounded-full border border-border/70 bg-card/95 p-0.5 shadow-sm backdrop-blur-sm" aria-label={`${groupLabel} place navigation`}>
        <button type="button" aria-label="Previous place" className={cn(readerIconButton,"size-8 border-0 bg-transparent")} disabled={index <= 0} onClick={onPrevious}><ChevronLeft className="size-4" /></button>
        <span aria-live="polite" className="min-w-15 px-1 text-center text-xs font-semibold tabular-nums">{index + 1} of {total}</span>
        <button type="button" aria-label="Next place" className={cn(readerIconButton,"size-8 border-0 bg-transparent")} disabled={index >= total - 1} onClick={onNext}><ChevronRight className="size-4" /></button>
      </div><button type="button" className={cn(readerIconButton,"bg-card/95 shadow-sm")} aria-label="Zoom to selected place" title={located ? "Zoom to place" : "Map location not shared"} disabled={!located} onClick={onZoom}><ZoomIn className="size-4" /></button></div>
      <span className="max-w-[45%] truncate rounded-full border border-border/60 bg-card/95 px-3 py-2 text-xs font-medium shadow-sm">{groupLabel}</span>
    </div>
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl">
      <div className="flex shrink-0 items-center gap-1 border-b border-border/60 px-3 pt-1" role="tablist" aria-label="Place information">
        {TABS.map((label,idx) => <button key={label} id={`${panelId}-tab-${idx}`} type="button" role="tab" aria-selected={tab === label} aria-controls={`${panelId}-panel-${idx}`} tabIndex={tab === label ? 0 : -1}
          onKeyDown={event => { if (["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) { event.preventDefault(); const next=event.key === "Home" ? 0 : event.key === "End" ? TABS.length-1 : (idx + (event.key === "ArrowRight" ? 1 : -1) + TABS.length)%TABS.length;setTab(TABS[next]);document.getElementById(`${panelId}-tab-${next}`)?.focus(); } }}
          onClick={() => setTab(label)} className={cn("relative min-h-11 whitespace-nowrap px-1.5 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",tab === label ? "text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground hover:text-foreground")}>{label}</button>)}
        <button type="button" aria-label="Close place details" className="ml-auto rounded-full p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onClose}><X className="size-4" /></button>
      </div>
      <div id={`${panelId}-panel-${TABS.indexOf(tab)}`} role="tabpanel" aria-labelledby={`${panelId}-tab-${TABS.indexOf(tab)}`} tabIndex={0} className="min-h-0 overflow-y-auto overscroll-contain p-4 text-sm @lg/planner:p-5">
        {tab === "Overview" && <div className="space-y-3"><div className="flex items-start gap-4"><div className="min-w-0 flex-1"><p className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{item.type === "charger" ? "EV charging" : live?.category ?? category ?? "In this journey"}</p><h2 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight">{name}</h2>{rating != null && rating > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Star className="size-3.5 fill-rating text-rating" /><span className="font-medium text-foreground">{rating.toFixed(1)}</span>{reviews != null && `(${new Intl.NumberFormat("en",{notation:"compact"}).format(reviews)} reviews)`}</p>}</div><ReaderStopPhoto item={item} className="size-17 shrink-0" /></div>
          {address && <p className="flex gap-2 text-xs leading-5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span className="line-clamp-2">{address}</span></p>}
          {description && <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{description}</p>}
          {live&&<p className="text-[10px] text-muted-foreground">Place information from {item.placeId?.startsWith("MAPBOX:")?"Mapbox":"Google Maps"}</p>}
          {hours && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3.5 shrink-0" /><span className="truncate">{hours}</span></p>}
          {phone && <a className="inline-flex items-center gap-2 text-xs text-primary" href={`tel:${phone.replace(/[^+0-9]/g,"")}`}><Phone className="size-3.5" />{phone}</a>}
          <Dialog><DialogTrigger className="block rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Full place details</DialogTrigger><DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{name}</DialogTitle><DialogDescription>{address || "Details for this stop"}</DialogDescription></DialogHeader>{detailBody}</DialogContent></Dialog>
        </div>}
        {tab === "Photos" && <div className="space-y-2">{selectedPhoto ? <><Dialog><DialogTrigger aria-label={`Enlarge photo of ${name}`} className="relative block w-full overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-ring"><img src={selectedPhoto.url} alt={name} className="h-29 w-full object-cover" onError={() => setFailedPhotos(old => [...old,selectedPhoto.url])} /><Maximize2 className="absolute right-2 bottom-2 size-5 rounded-sm bg-background/80 p-0.5" /></DialogTrigger><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>{name}</DialogTitle><DialogDescription>Place photograph · {selectedPhoto.attributions.map(a=>a.displayName).join(", ") || "Google Maps"}</DialogDescription></DialogHeader><img src={selectedPhoto.url} alt={name} className="max-h-[65dvh] w-full object-contain" /></DialogContent></Dialog>
          <div className="flex items-center justify-between gap-2 text-xs"><a href={safeExternalUrl(selectedPhoto.googleMapsUri) ?? maps} target="_blank" rel="noreferrer" className="min-w-0 truncate text-muted-foreground underline">Photo: {selectedPhoto.attributions.map(a=>a.displayName).join(", ") || "Google Maps"}</a><div className="flex shrink-0 items-center gap-2"><button aria-label="Previous photo" type="button" disabled={photoIndex <= 0} className={cn(readerIconButton,"size-7")} onClick={()=>setPhotoIndex(i=>i-1)}><ChevronLeft className="size-3.5" /></button>{Math.min(photoIndex+1,photos.length)}/{photos.length}<button aria-label="Next photo" type="button" disabled={photoIndex >= photos.length-1} className={cn(readerIconButton,"size-7")} onClick={()=>setPhotoIndex(i=>i+1)}><ChevronRight className="size-3.5" /></button></div></div><GoogleAttribution /></> : <><ReaderStopPhoto item={item} className="h-28 w-full" /><p className="text-xs text-muted-foreground">{query.isLoading ? "Finding photos…" : "No additional photos available."}</p></>}</div>}
        {tab === "Reviews" && <div className="space-y-3"><h3 className="font-semibold">Visitor reviews</h3><p className="text-sm text-muted-foreground">{rating != null ? `${rating.toFixed(1)} out of 5${reviews != null ? ` · ${reviews.toLocaleString()} Google reviews` : ""}` : "No visitor rating is available for this place."}</p><p className="text-xs leading-5 text-muted-foreground">See what visitors are saying on Google Maps. These are place reviews, separate from ratings of this {contextLabel === "In this guide" ? "guide" : "trip"}.</p><a href={maps} target="_blank" rel="noreferrer" className={readerButton}>Read visitor reviews<ExternalLink className="size-3.5" /></a></div>}
        {tab === contextLabel && <div className="space-y-3">{context}</div>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/15 px-4 py-2.5">
        <button type="button" className="min-h-8 rounded-sm text-xs font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onReveal}>{revealLabel}</button>
        <div className="flex items-center gap-2">{website && <a href={website} target="_blank" rel="noreferrer" className={cn(readerIconButton,"size-8")} aria-label="Place website"><ExternalLink className="size-3.5" /></a>}{directions && <a href={directions} target="_blank" rel="noreferrer" className={cn(readerButton,"min-h-8 px-3 text-xs")}><Navigation className="size-3.5" />Directions</a>}{located&&<SaveButton sourceToken={sourceToken} place={{providerPlaceId:item.placeId,name,address,location:{lat:item.lat!,lng:item.lng!},category:live?.category}} className="size-9" />}</div>
      </div>
    </div>
  </aside>;
}
