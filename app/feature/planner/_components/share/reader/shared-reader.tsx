"use client";
/* Owner-selected covers in the UI preview are temporary browser-local images. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createStore, Provider, useAtomValue, useSetAtom } from "jotai";
import { ArrowLeft, Bookmark, CalendarDays, CarFront, ChevronDown, Compass, MapPin, MessageSquarePlus, Share2, Zap } from "lucide-react";
import { PlanCover } from "@/app/feature/explore/_components/shared-plans/plan-cover";
import { PlanAuthor } from "@/app/feature/explore/_components/shared-plans/plan-author";
import { PlanEngagement } from "@/app/feature/explore/_components/shared-plans/plan-engagement";
import { GoogleAttribution } from "@/app/feature/explore/places/google-attribution";
import { CopySharedPlanButton } from "@/app/feature/explore/_components/shared-plans/copy-shared-plan-button";
import { PlannerWorkspace } from "../../../planId/_components/layout/planner-workspace";
import { TripBuilderErrorBoundary } from "../../../planId/_components/overview/trip-builder-error-boundary";
import type { SharedPlan } from "../publication-api";
import { buildReaderModel, readerDateLabel, type ReaderPresentation } from "./reader-model";
import { readerActionAtom, readerDayModeAtom, readerModelAtom, readerSelectionAtom, readerSingleDayAtom } from "./reader-state";
import { getTripBlockColorById } from "../../../planId/_components/constants/trip-block-colors";
import { ReaderGroupSection, ReaderItinerary } from "./reader-itinerary";
import { ReaderFeedback } from "./reader-feedback";
import { ReaderRelated } from "./reader-related";
import { ReaderMap } from "./reader-map";
import { ReaderRoutesProvider } from "./reader-routes";
import { PreviewAction, ReaderSection } from "./reader-ui";

export type SharedReaderProps = { shared:SharedPlan;token?:string;backLink?:{href:string;label:string};presentation?:ReaderPresentation };
export function SharedReader(props: SharedReaderProps) {
  const model=useMemo(()=>buildReaderModel(props.shared,props.presentation),[props.shared,props.presentation]);
  const store=useMemo(()=>{const value=createStore();value.set(readerModelAtom,model);return value;},[model]);
  return <Provider store={store}><ReaderRoutesProvider><ReaderWorkspace {...props} /></ReaderRoutesProvider></Provider>;
}
function ReaderWorkspace({shared,token,backLink,presentation}:SharedReaderProps) {
  const model=useAtomValue(readerModelAtom)!;
  const action=useSetAtom(readerActionAtom);
  const setSingleDay=useSetAtom(readerSingleDayAtom);
  const mode=useAtomValue(readerDayModeAtom);
  const selection=useAtomValue(readerSelectionAtom);
  const activeDay=model.days.find(day=>day.id===selection.groupId);
  const dayColor=getTripBlockColorById(activeDay?.colorId??"teal");
  const pendingScroll=useRef<ReturnType<typeof setTimeout>|null>(null);
  const scrollLock=useRef(false);
  const scrollPanelId="shared-reader-scroll-panel";
  const [failedCover,setFailedCover]=useState<string|null>(null);
  const navigate=useCallback((id:string)=>{
    const group=model.groups.find(g=>g.stops.some(s=>s.id===id));
    if(group){setSingleDay(group.kind==="day"?group.id:null);action({type:"select",stopId:id});}
    scrollLock.current=true;
    if(pendingScroll.current)clearTimeout(pendingScroll.current);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const target=document.getElementById(group?`reader-stop-${id}`:id);
      if(target){for(let node=target.parentElement;node;node=node.parentElement){if(node.tagName==="DETAILS")(node as HTMLDetailsElement).open=true;}
        target.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});}
    }));
    pendingScroll.current=setTimeout(()=>{scrollLock.current=false;},750);
  },[action,model,setSingleDay]);
  useEffect(()=>()=>{if(pendingScroll.current)clearTimeout(pendingScroll.current);},[]);
  useEffect(()=>{
    const panel=document.getElementById(scrollPanelId);if(!panel)return;
    let frame:number|null=null;
    function update(){frame=null;if(scrollLock.current||!panel)return;
      const rect=panel.getBoundingClientRect(),line=rect.top+panel.clientHeight*.3;
      const entries=[...panel.querySelectorAll<HTMLElement>("[data-reader-group]")].map(el=>({id:el.dataset.readerGroup!,rect:el.getBoundingClientRect()})).filter(e=>e.rect.height>0);
      const crossed=entries.filter(e=>e.rect.top<=line&&e.rect.bottom>line).at(-1);
      const next=entries.find(e=>e.rect.top>line&&e.rect.top<rect.bottom);
      if(crossed??next)action({type:"follow",groupId:(crossed??next)!.id});
    }
    function schedule(){if(frame===null)frame=requestAnimationFrame(update);}
    panel.addEventListener("scroll",schedule,{passive:true});
    return()=>{panel.removeEventListener("scroll",schedule);if(frame!==null)cancelAnimationFrame(frame);};
  },[action,model,mode]);
  const sections=[{id:"reader-overview",label:"Overview"},...(presentation?.vehicles?.length?[{id:"reader-garage",label:"Garage"}]:[]),...(model.lists.length?[{id:"reader-lists",label:"My List"}]:[]),...(shared.plan.budget?[{id:"reader-budget",label:"Budget"}]:[]),{id:"reader-itinerary",label:"Itinerary"},{id:"reader-feedback",label:"Ratings & comments"},...(shared.listedInExplore&&(token||presentation)?[{id:"reader-related",label:"Related plans"}]:[])];
  const cover=presentation?.cover;
  const showRelated=shared.listedInExplore&&Boolean(token||presentation);
  const coverUrl=cover?.url && (cover.url.startsWith("blob:")||/^https?:\/\//.test(cover.url)||cover.url.startsWith("/images/"))?cover.url:null;
  return <PlannerWorkspace scrollPanelId={scrollPanelId} details={null} map={<TripBuilderErrorBoundary><ReaderMap reveal={navigate} /></TripBuilderErrorBoundary>} itinerary={
    <div className="min-w-0 bg-background text-foreground" data-shared-reader>
      <header className="relative isolate overflow-hidden bg-muted">
        <PlanCover plan={model.coverPlan} creditLayout="footer" imageClassName="h-68 @lg/planner:h-84" photoCredit={coverUrl&&failedCover!==coverUrl?"Your cover photo - preview":undefined}>
        {coverUrl&&failedCover!==coverUrl&&<img src={coverUrl} alt={`Trip cover: ${model.destination||model.title}`} className="absolute inset-0 size-full object-cover" style={{objectPosition:cover?.position??"50% 50%"}} onError={()=>setFailedCover(coverUrl)} />}
        <div className="pointer-events-none absolute inset-0" style={{background:"linear-gradient(180deg,rgba(0,0,0,.22),transparent 32%,rgba(0,0,0,.76))"}} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-5" style={{color:"white"}}>
          {backLink?<Link href={backLink.href} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-current/20 bg-background/15 px-3 text-xs font-medium backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="size-3.5" />{backLink.label}</Link>:<span className="rounded-full bg-background/15 px-3 py-2 text-xs backdrop-blur-sm">Shared plan</span>}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-2 text-[10px] font-medium tracking-wider uppercase backdrop-blur-sm"><Compass className="size-3" />A Navio journey</span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-6 px-5 @lg/planner:px-7" style={{color:"white"}}>
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium"><MapPin className="size-3.5" />{model.destination||"A journey worth sharing"}</p>
          <h1 className="max-w-2xl text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.14] font-semibold tracking-tight wrap-break-word">{model.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90"><span>{shared.plan.dayCount} {shared.plan.dayCount===1?"day":"days"}</span><span>{model.coverPlan.placeCount} places</span>{model.coverPlan.chargerCount>0&&<span>{model.coverPlan.chargerCount} charging stops</span>}</div>
        </div>
        </PlanCover>
      </header>
      <nav aria-label="Shared plan contents" className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 bg-background/95 px-5 py-3 backdrop-blur-md @lg/planner:grid-cols-[auto_minmax(0,1fr)_auto] @lg/planner:gap-3 @lg/planner:px-7">
        <label className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><span className="shrink-0 font-medium">In this plan</span><span className="relative min-w-0"><select aria-label="Jump to section" defaultValue="reader-overview" onChange={e=>navigate(e.target.value)} className="min-h-9 w-full min-w-0 max-w-39 cursor-pointer appearance-none rounded-full border border-border bg-card py-1.5 pr-8 pl-3 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{sections.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select><ChevronDown className="pointer-events-none absolute top-3 right-3 size-3" /></span></label>
        {activeDay&&<button type="button" onClick={()=>navigate(`reader-group-${activeDay.id}`)} aria-label={`Go to ${activeDay.label}`} className="order-3 col-span-2 flex min-w-0 items-center gap-2 rounded-xl border border-border/60 px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring @lg/planner:order-2 @lg/planner:col-span-1" style={{background:`color-mix(in srgb, ${dayColor.value} 7%, var(--card))`}}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums" style={{background:dayColor.value,color:dayColor.foreground}}>{activeDay.label.replace("Day ","").padStart(2,"0")}</span>
          <span className="min-w-0"><span className="block truncate text-xs font-semibold">{activeDay.title||activeDay.label}</span><span className="block truncate text-[10px] text-muted-foreground">{readerDateLabel(activeDay.date)||"Dates not shared"} · {activeDay.stops.length} stops</span></span>
        </button>}
        <div className="order-2 flex shrink-0 justify-self-end gap-2 @lg/planner:order-3 @lg/planner:col-start-3"><PreviewAction label="Save plan"><Bookmark className="size-3.5" /></PreviewAction><PreviewAction label="Share plan"><Share2 className="size-3.5" /></PreviewAction></div>
      </nav>
      <div className="px-5 @lg/planner:px-7">
        <section id="reader-overview" className="scroll-mt-24 space-y-5 pt-6 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><PlanAuthor name={shared.authorName} size="default" /><span className="text-[11px] text-muted-foreground">View-only trip plan</span></div>
          {presentation?.introduction&&<p className="text-sm leading-7 text-muted-foreground">{presentation.introduction}</p>}
          {readerDateLabel(shared.plan.startDate)&&<p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{readerDateLabel(shared.plan.startDate)}{shared.plan.endDate&&shared.plan.endDate!==shared.plan.startDate&&readerDateLabel(shared.plan.endDate)&&` – ${readerDateLabel(shared.plan.endDate)}`}</p>}
          {shared.listedInExplore&&<div className="rounded-xl border border-border/60 bg-card/60 p-3.5"><PlanEngagement {...shared.engagement} detail /></div>}
          {token&&<div className="flex flex-wrap items-start gap-2"><CopySharedPlanButton token={token} hasUnlocatedStops={model.days.some(g=>g.stops.some(s=>!s.located))} />{shared.listedInExplore&&<Link href={`/community/create?${new URLSearchParams({plan:token})}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><MessageSquarePlus className="size-4" aria-hidden="true" />Discuss in Community</Link>}</div>}
        </section>
        {presentation?.vehicles?.length?<ReaderSection id="reader-garage" eyebrow="Made for the road" title="Garage"><div className="space-y-3">{presentation.vehicles.map(vehicle=><article key={vehicle.id} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4"><span className="rounded-xl bg-primary/8 p-3"><CarFront className="size-7 text-primary" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{vehicle.source==="catalog"?"Navio catalogue":"Custom vehicle"}</p><h3 className="mt-1 font-semibold">{vehicle.name}</h3><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{vehicle.batteryKwh&&<span>{vehicle.batteryKwh} kWh battery</span>}{vehicle.rangeKm&&<span>{vehicle.rangeKm} km reference range</span>}</div><p className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary"><Zap className="size-3.5" />{vehicle.connectors.join(" · ")||"Connector information not shared"}</p></div></article>)}</div><p className="text-xs leading-5 text-muted-foreground">Vehicle specifications are a planning reference. Actual range and charging availability can vary.</p></ReaderSection>:null}
        {model.lists.length>0&&<ReaderSection id="reader-lists" eyebrow="Ideas beyond the itinerary" title="My List">{model.lists.map(group=><ReaderGroupSection key={group.id} group={group} />)}</ReaderSection>}
        {shared.plan.budget&&<ReaderSection id="reader-budget" title="Trip budget"><details className="rounded-2xl border border-border/60 bg-card p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Budget shared by the owner</span><strong className="text-lg font-semibold">{shared.plan.budget.amount.toLocaleString()} {shared.plan.budget.currency}</strong></summary><ul className="mt-4 divide-y divide-border/60 text-sm">{shared.plan.budget.expenses?.map((expense,i)=><li key={i} className="flex justify-between gap-3 py-2"><span className="text-muted-foreground">{expense.label}</span><span>{expense.amount.toLocaleString()} {shared.plan.budget!.currency}</span></li>)}</ul></details></ReaderSection>}
        <ReaderItinerary /><ReaderFeedback />
        {showRelated&&<ReaderRelated token={token??"reader-design-preview"} plan={shared.plan} />}
        <footer className="flex items-center justify-between gap-3 border-t border-border/60 py-6 text-[10px] text-muted-foreground"><span>Shared by a traveler. Make it your own.</span><GoogleAttribution /></footer>
      </div>
    </div>
  }>{null}</PlannerWorkspace>;
}
