"use client";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Settings2 } from "lucide-react";
import { SharedReader } from "./shared-reader";
import { readerPreviewPlan, readerPreviewPresentation } from "./data";
import { applyPublicationPreview, initialPublicationPreview, publicationPreviewReady } from "./publication-preview-model";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { readerButton } from "./reader-ui";

export function ReaderPreview() {
  const [draft,setDraft]=useState(()=>initialPublicationPreview(readerPreviewPresentation));
  const [cover,setCover]=useState<string|null>(null);
  const [position,setPosition]=useState(50);
  const [error,setError]=useState("");
  const [applied,setApplied]=useState(false);
  useEffect(()=>()=>{if(cover)URL.revokeObjectURL(cover);},[cover]);
  const presentation=useMemo(()=>({...applyPublicationPreview(readerPreviewPresentation,draft),...(cover?{cover:{url:cover,position:`50% ${position}%`}}:{})}),[draft,cover,position]);
  return <div className="flex h-dvh flex-col overflow-hidden bg-background">
    <div className="z-40 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 text-xs"><span className="text-muted-foreground"><strong className="text-foreground">Shared Plan · design preview</strong><span className="hidden sm:inline"> · Example content, no publishing or saving</span></span>
      <Dialog><DialogTrigger className={readerButton}><Settings2 className="size-3.5" />Publishing preview</DialogTrigger><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>What this example shares</DialogTitle><DialogDescription>These controls only change this preview. No account, vehicle, file or publication is saved.</DialogDescription></DialogHeader>
        <div className="space-y-5"><section className="space-y-3"><h3 className="text-sm font-semibold">Trip cover</h3><label className={`${readerButton} cursor-pointer focus-within:ring-2 focus-within:ring-ring`}><ImagePlus className="size-4" />Try a cover photo<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{const file=event.target.files?.[0];event.target.value="";if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024){setError("Choose a JPG, PNG or WebP image under 5 MB.");return;}setError("");setApplied(false);setCover(URL.createObjectURL(file));}} /></label>{cover&&<><label className="block text-xs text-muted-foreground">Vertical crop position<input type="range" min={0} max={100} value={position} onChange={e=>setPosition(Number(e.target.value))} className="mt-2 w-full accent-[var(--primary)]" /></label><button type="button" className="text-xs text-primary" onClick={()=>setCover(null)}>Restore destination photo</button></>}{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}</section>
        <section className="space-y-3"><h3 className="text-sm font-semibold">Garage</h3>{readerPreviewPresentation.vehicles?.map(vehicle=><div key={vehicle.id} className="rounded-xl border border-border p-3"><p className="text-sm font-medium">{vehicle.name}</p>{vehicle.source==="catalog"?<label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={!draft.excludedCatalogIds.includes(vehicle.id)} onChange={e=>{setApplied(false);setDraft(d=>({...d,excludedCatalogIds:e.target.checked?d.excludedCatalogIds.filter(id=>id!==vehicle.id):[...d.excludedCatalogIds,vehicle.id]}));}} />Include catalogue vehicle</label>:<fieldset className="mt-2 text-xs"><legend className="mb-2 text-muted-foreground">Custom vehicle · choose before publishing</legend><div className="flex gap-4">{([true,false] as const).map(include=><label key={String(include)} className="flex items-center gap-2"><input type="radio" name={vehicle.id} checked={draft.customDecisions[vehicle.id]===include} onChange={()=>{setApplied(false);setDraft(d=>({...d,customDecisions:{...d.customDecisions,[vehicle.id]:include}}));}} />{include?"Include":"Keep private"}</label>)}</div></fieldset>}</div>)}<p className="text-xs leading-5 text-muted-foreground">Excluding a car here never removes it from the original trip. Copies will carry shared vehicle setup into the copied trip only.</p></section>
        <section className="space-y-3"><h3 className="text-sm font-semibold">My List</h3>{readerPreviewPresentation.lists?.map((list,index)=><label key={index} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.includedListIndexes.includes(index)} onChange={e=>{setApplied(false);setDraft(d=>({...d,includedListIndexes:e.target.checked?[...d.includedListIndexes,index]:d.includedListIndexes.filter(i=>i!==index)}));}} />{list.title}</label>)}</section>
        <button type="button" className={readerButton} disabled={!publicationPreviewReady(draft)} onClick={()=>setApplied(true)}>Preview publication</button><p aria-live="polite" className="text-xs text-muted-foreground">{applied?"Preview ready. Nothing was published.":publicationPreviewReady(draft)?"Close this panel to review your selection.":"Choose whether to include the custom vehicle to finish this preview."}</p>
        </div>
      </DialogContent></Dialog>
    </div>
    <main className="min-h-0 flex-1"><SharedReader shared={readerPreviewPlan} presentation={presentation} backLink={{href:"/explore",label:"Back to Explore"}} /></main>
  </div>;
}
