"use client";
/* Provider photos are live, credited and never sent through the image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { readPlace, safeExternalUrl } from "@/app/feature/explore/places/places-api";
import { planCoverReference } from "@/app/feature/explore/_components/shared-plans/plan-cover";
import { PLAN_DESTINATION_COVERS } from "@/app/feature/explore/_components/shared-plans/plan-cover.data";
import { PlaceNotesPreview } from "../../../planId/_components/block/items/place-notes";
import type { PublicItem } from "../publication-api";

export const readerButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";
export const readerIconButton = "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";
export function ReaderSection({ id, eyebrow, title, children, action }: { id: string; eyebrow?: string; title: string; children: ReactNode; action?: ReactNode }) {
  return <section id={id} className="scroll-mt-24 space-y-5 border-t border-border/60 py-8 @lg/planner:py-10">
    <div className="flex min-w-0 items-end justify-between gap-3"><div className="min-w-0">{eyebrow && <p className="mb-1.5 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">{eyebrow}</p>}<h2 className="text-xl font-semibold tracking-tight @lg/planner:text-2xl">{title}</h2></div>{action}</div>
    {children}
  </section>;
}
export function PreviewAction({ label, children, className, title }: { label: string; children: ReactNode; className?: string; title?: string }) {
  return <Dialog><DialogTrigger aria-label={label} title={title ?? `${label} preview`} className={cn(readerIconButton, className)}>{children}</DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>{label}</DialogTitle><DialogDescription>This interaction is a design preview. Nothing is saved or shared yet.</DialogDescription></DialogHeader></DialogContent>
  </Dialog>;
}
export function ReaderNotes({ value, label = "From the planner", plain=false }: { value?: string; label?: string; plain?:boolean }) {
  if (!value?.trim()) return null;
  return <div className={cn("text-sm",!plain&&"rounded-xl bg-muted/40 p-3.5")}>
    <p className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
    <details className="group/notes"><summary className="cursor-pointer list-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="group-open/notes:hidden"><PlaceNotesPreview value={value} interactive={false} /></div>
      <span className="mt-1 inline-block text-xs font-medium text-primary group-open/notes:hidden">Read note</span><span className="hidden text-xs font-medium text-primary group-open/notes:inline">Hide note</span>
    </summary><div className="mt-2"><PlaceNotesPreview value={value} interactive={true} clamped={false} /></div></details>
  </div>;
}
export function useReaderPlace(item: PublicItem, enabled = true) {
  const reference = item.type === "charger" ? null : planCoverReference(item.placeId);
  return useQuery({ queryKey: ["discovery-place", reference], queryFn: ({ signal }) => readPlace(reference!, signal),
    enabled: Boolean(reference) && enabled, staleTime: 60_000, gcTime: 0, retry: 1, retryOnMount: false });
}
export function ReaderStopPhoto({ item, className, onSelect }: { item: PublicItem; className?: string; onSelect?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const bundled = PLAN_DESTINATION_COVERS.find(cover => cover.src === item.imageUrl);
  const stored = bundled?.src ?? safeExternalUrl(item.imageUrl);
  const query = useReaderPlace(item, near && (!stored || failed.includes(stored)));
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setNear(true); observer.disconnect(); } }, { rootMargin: "100px" });
    observer.observe(ref.current); return () => observer.disconnect();
  }, []);
  const photo = query.data?.photos.find(p => safeExternalUrl(p.url) && !failed.includes(p.url));
  const legacy = safeExternalUrl(query.data?.place.photoUrl);
  const src = stored && !failed.includes(stored) ? stored : photo?.url ?? (legacy && !failed.includes(legacy) ? legacy : undefined);
  return <div ref={ref} className={cn("relative overflow-hidden rounded-xl bg-muted", className)}>
    {src ? <img src={src} alt={item.name ?? "Place photo"} loading="lazy" className="size-full object-cover" onError={() => setFailed(old => [...old, src])} />
      : <div className="flex size-full items-center justify-center text-muted-foreground/40"><MapPin className="size-6" aria-hidden="true" /></div>}
    {onSelect && <button type="button" onClick={onSelect} aria-label={`View ${item.name ?? "place"} on map`} className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" />}
    {photo && src === photo.url && <a href={safeExternalUrl(photo.googleMapsUri) ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name ?? "place")}`}
      target="_blank" rel="noreferrer" className="absolute inset-x-0 bottom-0 truncate bg-background/95 px-2 py-1 text-[9px] text-muted-foreground" title={photo.attributions.map(a => a.displayName).join(", ")}>Photo: {photo.attributions.map(a => a.displayName).join(", ") || "Google Maps"}</a>}
    {bundled && src === bundled.src && <a href={bundled.sourceUrl} target="_blank" rel="noreferrer" className="absolute inset-x-0 bottom-0 truncate bg-background/95 px-2 py-1 text-[9px] text-muted-foreground" title={`Photo: ${bundled.author} · ${bundled.license}`}>Photo credit</a>}
  </div>;
}
export function EmptyPhoto() { return <div className="flex h-28 items-center justify-center gap-2 rounded-xl bg-muted text-sm text-muted-foreground"><ImageIcon className="size-4" />No photos available</div>; }
