"use client";
import { useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Check, ChevronDown, Crosshair, ExternalLink, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEG_TRAVEL_MODE_META } from "../../../planId/_components/routes/leg-travel-mode-meta";
import { isTransitMode } from "../../../planId/_components/routes/leg-travel-mode";
import { useTravelOptions } from "../../../planId/_components/routes/use-travel-options";
import { RouteSegmentInfo } from "../../../planId/_components/routes/route-segment-info";
import { formatRouteDuration, formatRouteDistance } from "../../../planId/_components/routes/trip-route.helpers";
import type { LegTravelMode } from "../../../planId/_components/constants/types";
import { getTripBlockColorById } from "../../../planId/_components/constants/trip-block-colors";
import { readerActionAtom } from "./reader-state";
import { readerFocusedRouteAtom, readerRouteOverridesAtom, useReaderRoutes } from "./reader-routes";
import { readerRoutePoint, type ReaderRouteLeg } from "./reader-route-model";
import { readerIconButton } from "./reader-ui";

export function ReaderRouteRow({leg,colorId}:{leg:ReaderRouteLeg;colorId:Parameters<typeof getTripBlockColorById>[0]}) {
  const [open,setOpen]=useState(false);
  const [overrides,setOverrides]=useAtom(readerRouteOverridesAtom);
  const focus=useSetAtom(readerFocusedRouteAtom);
  const action=useSetAtom(readerActionAtom);
  const routes=useReaderRoutes();
  const color=getTripBlockColorById(colorId);
  const mode=overrides[leg.id]??leg.plannedMode??"drive";
  const {Icon,label}=LEG_TRAVEL_MODE_META[mode];
  const segment=routes.allSegments.find(s=>s.blockId===leg.groupId&&s.fromItemId===leg.from.id&&s.toItemId===leg.to.id)??null;
  const options=useTravelOptions(leg.groupId,readerRoutePoint(leg.from),readerRoutePoint(leg.to),open);
  const comparison=overrides[leg.id]!==undefined;
  const modes:LegTravelMode[]=["drive","transit","bike","walk"];
  const googleMode=mode==="bike"?"bicycling":mode==="walk"?"walking":isTransitMode(mode)?"transit":"driving";
  const link=`https://www.google.com/maps/dir/?api=1&origin=${leg.from.item.lat},${leg.from.item.lng}&destination=${leg.to.item.lat},${leg.to.item.lng}&travelmode=${googleMode}`;
  return <div className="relative my-4 ml-4 border-l-2 border-dashed border-border py-1 pl-5" data-reader-leg={leg.id}>
    <div className="flex min-w-0 items-center justify-between gap-2">
      <button type="button" aria-expanded={open} aria-controls={`reader-route-${leg.id}`} onClick={()=>setOpen(value=>!value)} className="inline-flex min-h-10 min-w-0 items-center gap-2 rounded-full bg-muted/60 pr-3 pl-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="rounded-full bg-card p-2"><Icon className="size-4" style={{color:color.value}} /></span>
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs"><span className="sr-only">{label} </span><strong className="font-mono text-sm font-semibold">{routes.query.isLoading?"Finding route…":segment?.status==="routed"&&segment.durationSeconds!=null?formatRouteDuration(segment.durationSeconds):"Unverified"}</strong>{segment?.status==="routed"&&segment.distanceMeters!=null&&<span className="text-muted-foreground">{formatRouteDistance(segment.distanceMeters)}</span>}<span className="text-[9px] text-muted-foreground">{comparison?"Comparison":leg.plannedMode?"In plan":"Suggested"}</span></span>
        <ChevronDown className={cn("size-3 shrink-0 text-muted-foreground transition-transform",open&&"rotate-180")} />
      </button>
      <button type="button" aria-label={`Show route from ${leg.from.item.name} to ${leg.to.item.name}`} className={cn(readerIconButton,"size-8 border-0 bg-transparent")} disabled={!segment?.geometry.coordinates.length} onClick={()=>{action({type:"follow",groupId:leg.groupId});focus(leg.id);if(segment)action({type:"leg",coordinates:segment.geometry.coordinates});}}><Crosshair className="size-4" /></button>
    </div>
    {open&&<div id={`reader-route-${leg.id}`} className="mt-3 space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/50 p-1" role="group" aria-label="Compare transport modes">{modes.map(key=>{
        const meta=LEG_TRAVEL_MODE_META[key],option=options.data?.find(o=>o.key===key)?.segment;
        const selected=key===mode||(key==="transit"&&isTransitMode(mode));
        return <button key={key} type="button" aria-pressed={selected} onClick={()=>setOverrides(current=>({...current,[leg.id]:key}))} className={cn("flex min-h-20 min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg px-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",selected?"bg-card text-primary shadow-xs":"text-muted-foreground hover:bg-card/60")}><meta.Icon className="size-4" /><span>{key==="transit"?"Transit":meta.label}</span><span className="text-[10px]">{options.isLoading?"Finding…":option?.status==="routed"&&option.durationSeconds!=null?formatRouteDuration(option.durationSeconds):"Unverified"}</span></button>;
      })}</div>
      <p className="text-xs leading-5 text-muted-foreground">{leg.from.item.name} <span aria-hidden="true">→</span> {leg.to.item.name}</p>
      <RouteSegmentInfo segment={segment} isError={routes.query.isError} isLoading={routes.query.isFetching} routeColor={color.mapColor} plannedMode={mode} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs"><a href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1.5 text-muted-foreground underline underline-offset-4">Google Maps<ExternalLink className="size-3" /></a>
        {comparison?<button type="button" className="inline-flex min-h-8 items-center gap-1 text-primary" onClick={()=>setOverrides(current=>{const next={...current};delete next[leg.id];return next;})}><RotateCcw className="size-3" />{leg.plannedMode?"Restore plan":"Reset comparison"}</button>:leg.plannedMode?<span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 font-medium text-primary"><Check className="size-3" />In plan · {LEG_TRAVEL_MODE_META[leg.plannedMode].label}</span>:<span className="text-muted-foreground">Owner’s mode not shared</span>}
      </div>
      <p className="text-[10px] leading-4 text-muted-foreground">Current route estimates. Comparisons do not change the shared plan.</p>
      {routes.query.isError&&<button type="button" className="text-xs text-primary underline" onClick={()=>void routes.query.refetch()}>Retry route</button>}
    </div>}
  </div>;
}
