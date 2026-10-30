"use client";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { CalendarDays, Check, ChevronDown, Clock, MapPin, Route, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTripBlockColorById } from "../../../planId/_components/constants/trip-block-colors";
import { plannerMobileViewAtom } from "../../../planId/_components/layout/planner-workspace";
import { SharedDayAnchors } from "../shared-day-anchors";
import { readerDateLabel, type ReaderGroup, type ReaderStop } from "./reader-model";
import { readerActionAtom, readerDayModeAtom, readerFilterMapAtom, readerModelAtom, readerSelectionAtom, readerSingleDayAtom } from "./reader-state";
import { ReaderDisclosure, ReaderNotes, ReaderSection, ReaderStopPhoto } from "./reader-ui";
import { ReaderRouteRow } from "./reader-route-row";
import { useReaderRoutes } from "./reader-routes";

export function SharedStopCard({ stop }: { stop: ReaderStop }) {
  const action = useSetAtom(readerActionAtom);
  const selection = useAtomValue(readerSelectionAtom);
  const setMobileView = useSetAtom(plannerMobileViewAtom);
  const model = useAtomValue(readerModelAtom);
  const group = model?.groups.find(g => g.id === stop.groupId);
  const color = getTripBlockColorById(group?.colorId ?? "teal");
  const selected = selection.stopId === stop.id && !selection.dismissed;
  const item = stop.item;
  function select() {
    action({ type: "select", stopId: stop.id });
    if (window.matchMedia("(max-width: 1023px)").matches) setMobileView("map");
  }
  return <article id={`reader-stop-${stop.id}`} className={cn("group/stop relative grid min-w-0 scroll-mt-28 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-[border-color,box-shadow] @lg/planner:grid-cols-[minmax(0,1fr)_minmax(10rem,35%)]",selected&&"border-primary/45 ring-1 ring-primary/15")}>
    <div className="relative min-w-0 @lg/planner:order-2">
      <ReaderStopPhoto item={item} onSelect={select} className="aspect-[16/8] w-full rounded-none @lg/planner:aspect-auto @lg/planner:h-full @lg/planner:min-h-48" />
      <span className="pointer-events-none absolute top-3 left-3 flex size-9 items-center justify-center rounded-full text-sm font-bold shadow-sm" style={{background:color.value,color:color.foreground}}>{item.type==="charger"?<Zap className="size-4" />:String(stop.number).padStart(2,"0")}</span>
    </div>
    <div className="flex min-w-0 flex-col p-4 @lg/planner:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-wide uppercase"><span style={{color:color.value}}>{item.type==="charger"?"EV charging":item.placeType?.replaceAll("_"," ")||`Stop ${stop.number}`}</span>{item.time&&<span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-muted-foreground"><Clock className="size-3" />{item.time}{item.timeEnd&&` - ${item.timeEnd}`}</span>}</div>
      <button type="button" onClick={select} aria-pressed={selected} className="max-w-full self-start rounded-sm text-left text-lg font-semibold leading-snug tracking-tight hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring @lg/planner:text-xl">{item.name??"Planned stop"}</button>
      {item.rating!=null&&item.rating>0&&<p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Star className="size-3.5 fill-rating text-rating" /><strong className="font-medium text-foreground">{item.rating.toFixed(1)}</strong>{item.reviewCount!=null&&<span>({new Intl.NumberFormat("en",{notation:"compact"}).format(item.reviewCount)})</span>}</p>}
      {item.cost!=null&&<p className="mt-2 text-xs text-muted-foreground">Estimated cost <span className="font-medium text-foreground">{item.cost.toLocaleString()} {model?.budget?.currency??""}</span></p>}
      {item.description&&<p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>}
      {(item.notes || Boolean(item.schedule?.length)) && <div className="mt-4 border-l-2 pl-3" style={{borderColor:`color-mix(in srgb, ${color.value} 45%, transparent)`}}><ReaderNotes value={item.notes} label={item.notes ? "Owner's tip" : "Visit details"} plain>
        {item.schedule?.length ? <div className="space-y-2" aria-label="Visit schedule">{item.schedule.map(moment=><div key={moment.id} className="flex gap-3 text-xs"><span className="shrink-0 font-medium tabular-nums text-primary">{moment.time}{moment.timeEnd&&` - ${moment.timeEnd}`}</span><span className="min-w-0 text-muted-foreground">{moment.label}</span></div>)}</div> : null}
      </ReaderNotes></div>}
      {item.charger&&<div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{item.charger.connectorTypes?.map(c=><span key={c} className="rounded-md bg-muted px-2 py-1">{c}</span>)}{item.charger.maxKw&&<span>{item.charger.maxKw} kW</span>}{item.charger.priceText&&<span>{item.charger.priceText}</span>}</div>}
      <div className="mt-auto flex items-end justify-between gap-3 pt-4"><p className="min-w-0 text-[11px] leading-5 text-muted-foreground">{!stop.located?"Map location not shared":item.address&&<span className="line-clamp-2">{item.address}</span>}</p><button type="button" onClick={select} className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-muted/60 px-3 text-xs font-medium text-foreground transition-colors hover:bg-primary/8 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><MapPin className="size-3.5" />Explore stop</button></div>
    </div>
  </article>;
}
export function ReaderGroupSection({ group }: { group: ReaderGroup }) {
  const dispatch = useSetAtom(readerActionAtom);
  const [filter, setFilter] = useAtom(readerFilterMapAtom);
  const selection = useAtomValue(readerSelectionAtom);
  const routes=useReaderRoutes();
  const date = readerDateLabel(group.date);
  const color = getTripBlockColorById(group.colorId);
  return <div id={`reader-group-${group.id}`} data-reader-group={group.id} className="scroll-mt-24">
    <details open className="group/day">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl border border-l-4 border-border/60 p-4 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{borderLeftColor:color.value,background:`color-mix(in srgb, ${color.value} 7%, var(--card))`}}>
        <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl" style={{background:color.value,color:color.foreground}}><span className="text-[8px] font-semibold tracking-[.15em] uppercase">{group.kind==="day"?"Day":"List"}</span><strong className="text-xl font-semibold tabular-nums">{group.kind==="day"?group.label.replace("Day ","").padStart(2,"0"):"+"}</strong></span>
        <div className="min-w-0 flex-1"><p className="mb-1 flex flex-wrap gap-x-2 text-[10px] font-medium text-muted-foreground"><span>{date??(group.kind==="day"?"Dates not shared":"Shared list")}</span><span>{group.stops.length} stops</span></p><h3 className="text-base font-semibold leading-snug tracking-tight @lg/planner:text-lg">{group.title&&group.title!==group.label?group.title:group.kind==="list"?group.label:group.label+" itinerary"}</h3>{group.stops.length>1&&<p className="mt-1 truncate text-[11px] text-muted-foreground">{group.stops[0].item.name} {"\u2192"} {group.stops.at(-1)?.item.name}</p>}</div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/day:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="space-y-3 pt-4 pb-8">
        {group.stops.length > 0 && <button type="button" className="mb-1 inline-flex min-h-8 items-center gap-2 rounded-full bg-primary/7 px-3 text-xs font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => { dispatch({ type: "follow", groupId: group.id }); setFilter(!(filter && selection.groupId === group.id)); dispatch({ type: "overview" }); }}>
          <Route className="size-3.5" />{filter && selection.groupId === group.id ? "Show all places on map" : "Show this section on map"}
        </button>}
        {(group.startsAt || group.endsAt) && <SharedDayAnchors startsAt={group.startsAt} endsAt={group.endsAt} />}
        {group.entries.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No stops were shared for this section.</p>}
        {group.entries.map(entry => entry.stop ? <div key={entry.id}>{routes.legs.find(leg=>leg.id===entry.stop!.id)&&<ReaderRouteRow leg={routes.legs.find(leg=>leg.id===entry.stop!.id)!} colorId={group.colorId} />}<SharedStopCard stop={entry.stop} /></div> : entry.item.type === "note"
          ? <ReaderNotes key={entry.id} value={entry.item.noteContent} label="Trip note" previewWhenHidden />
          : entry.item.type === "checklist" ? <div key={entry.id} className="rounded-xl border border-border/60 bg-card p-4"><h4 className="mb-2 text-sm font-medium">{entry.item.checklistTitle || "Checklist"}</h4><ReaderDisclosure label={entry.item.checklistTitle || "Checklist"}><ul className="space-y-2 text-sm text-muted-foreground">{entry.item.checklistLabels?.map((label, index) => <li key={index} className="flex gap-2"><Check className="mt-1 size-3.5 shrink-0" />{label}</li>)}</ul></ReaderDisclosure></div> : null)}
      </div>
    </details>
  </div>;
}
export function ReaderItinerary() {
  const model = useAtomValue(readerModelAtom)!;
  const [mode, setMode] = useAtom(readerDayModeAtom);
  const [dayId, setDay] = useAtom(readerSingleDayAtom);
  const selection = useAtomValue(readerSelectionAtom);
  const action = useSetAtom(readerActionAtom);
  const selectedDay = model.days.find(g => g.id === dayId) ?? model.days.find(g => g.id === selection.groupId) ?? model.days[0];
  const visible = mode === "single" ? model.days.filter(g => g.id === selectedDay?.id) : model.days;
  return <ReaderSection id="reader-itinerary" eyebrow="The journey, day by day" title="Itinerary">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3">
      <div className="flex items-center gap-2"><span className="mr-1 text-xs text-muted-foreground">Show</span><div className="inline-flex gap-0.5 rounded-lg bg-muted/60 p-0.5" role="group" aria-label="Days displayed">{([['all','All dates'],['single','By date']] as const).map(([value,label]) => <button key={value} type="button" aria-pressed={mode === value} className={cn("min-h-9 rounded-md px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", mode === value ? "bg-card shadow-xs" : "text-muted-foreground")} onClick={() => { setMode(value); if (value === "single" && selectedDay) { setDay(selectedDay.id); action({ type:"follow",groupId:selectedDay.id }); } }}>{label}</button>)}</div></div>
      {mode === "single" && selectedDay && <Select items={model.days.map(g => ({ value:g.id,label:`${g.label}${readerDateLabel(g.date) ? ` · ${readerDateLabel(g.date)}` : ""}` }))} value={selectedDay.id} onValueChange={id => { if(id){setDay(id);action({type:"follow",groupId:id});} }}><SelectTrigger aria-label="Choose itinerary day" className="min-w-0 max-w-full bg-background text-xs"><CalendarDays className="size-3.5" /><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}>{model.days.map(g => <SelectItem key={g.id} value={g.id}>{g.label}{readerDateLabel(g.date) && ` · ${readerDateLabel(g.date)}`}</SelectItem>)}</SelectContent></Select>}
    </div>
    {visible.length ? visible.map(g => <ReaderGroupSection key={g.id} group={g} />) : <p className="text-sm text-muted-foreground">No itinerary days were published.</p>}
  </ReaderSection>;
}
