"use client";

import Link from "next/link";
import {SaveButton} from "../saved/save-button";
import { BookOpen, Eye, MapPin, Share2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GuideCoverPhoto } from "../admin/_components/guides/guide-cover-photo";
import type { GuideSummary } from "../admin/_components/guides/guides-api";
import type { PublishedGuideSummary } from "./user-guides-api";
import { GuideAuthor } from "./guide-author";
import { cn } from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";

export function TravelerGuideCard({
  guide,
  layout = "default",
}: {
  guide: PublishedGuideSummary & {source?:"TRAVELER"|"CURATED";viewCount?:number;ratingAverage?:number|null;ratingCount?:number;collections?:string[];discoveryLabel?:string|null};
  layout?: "default" | "planner" | "discovery";
}) {
  if(layout==='discovery')return <DiscoveryGuideCard guide={guide}/>;
  const isPlanner = layout === "planner";

  return (
    <article className="relative h-full min-w-0"><Link
      href={`/explore/guides/${guide.id}`}
      className={cn(
        "group flex h-full min-w-0 flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isPlanner
          ? "overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:border-accent/30 hover:shadow-lg motion-reduce:transition-none @min-[30rem]:flex-row"
          : "gap-3 rounded-xl",
      )}
    >
      <GuideCoverPhoto
        placeId={guide.coverPlaceId}
        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 90vw"
        className={cn(
          "w-full",
          isPlanner
            ? "aspect-[16/7] rounded-none bg-muted/70 @min-[30rem]:aspect-auto @min-[30rem]:min-h-36 @min-[30rem]:w-[42%] @min-[30rem]:shrink-0"
            : "aspect-3/2 rounded-xl",
        )}
      />
      <div className={cn("space-y-2", isPlanner ? "flex min-w-0 flex-1 flex-col p-3.5" : "px-1 pb-1")}>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">
            {guide.destinationName}
            {guide.country &&
            guide.country.toLocaleLowerCase() !==
              guide.destinationName.toLocaleLowerCase()
              ? `, ${guide.country}`
              : ""}
          </span>
        </p>
        <h3 className={cn("line-clamp-2 leading-snug font-semibold tracking-tight group-hover:text-primary", isPlanner ? "text-base" : "text-lg")}>
          {guide.name}
        </h3>
        {guide.description ? (
          <p className={cn("text-sm leading-relaxed text-muted-foreground", isPlanner ? "line-clamp-1" : "line-clamp-2")}>
            {guide.description}
          </p>
        ) : null}
        <div className={cn("flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground", isPlanner && "mt-auto pt-1")}>
          <GuideAuthor author={guide.author} />
          <span className="flex shrink-0 items-center gap-1.5">
            <BookOpen aria-hidden="true" className="size-3.5" />
            {guide.placeCount} {guide.placeCount === 1 ? "place" : "places"}
          </span>
        </div>
      </div>
    </Link><div className="absolute right-3 top-3"><SaveButton guide={{id:guide.id,source:"TRAVELER"}}/></div></article>
  );
}

export function YourGuideCard({ guide }: { guide: GuideSummary }) {
  return (
    <Link
      href={`/dashboard/guides/${guide.id}`}
      className="group flex min-w-0 items-center gap-4 rounded-xl border border-border bg-card p-3 outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <GuideCoverPhoto
        placeId={guide.coverPlaceId}
        sizes="96px"
        className="size-20 shrink-0 rounded-lg sm:size-24"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <Badge variant={guide.status === "PUBLISHED" ? "default" : "secondary"}>
          {guide.status === "PUBLISHED" ? "Published" : "Draft"}
        </Badge>
        <h3 className="truncate text-base font-semibold group-hover:text-primary">
          {guide.name}
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {guide.country || "Destination guide"} · {guide.placeCount}{" "}
          {guide.placeCount === 1 ? "place" : "places"}
        </p>
      </div>
    </Link>
  );
}

function DiscoveryGuideCard({guide}:{guide:PublishedGuideSummary & {source?:"TRAVELER"|"CURATED";viewCount?:number;ratingAverage?:number|null;ratingCount?:number;collections?:string[];discoveryLabel?:string|null}}){
 const source=guide.source??'TRAVELER',href=`/explore/guides/${guide.id}${source==='CURATED'?'?source=curated':''}`;
 async function share(){try{const url=new URL(href,window.location.origin).href;if(navigator.share)await navigator.share({title:guide.name,url});else{await navigator.clipboard.writeText(url);toast.success('Guide link copied');}}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))toast.error('The link could not be shared. Please try again.');}}
 return <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-md motion-reduce:transition-none">
  <Link href={href} aria-label={`Read ${guide.name}`} className="relative block overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><GuideCoverPhoto placeId={guide.coverPlaceId} sizes="(min-width:1024px) 360px,(min-width:640px) 45vw,90vw" className="aspect-[4/3] w-full rounded-none"/>
   <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"><BookOpen aria-hidden="true" className="size-3.5"/>{guide.placeCount} {guide.placeCount===1?'place':'places'}</span>
  </Link>
  <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
   <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><MapPin aria-hidden="true" className="size-3.5 shrink-0"/><span className="truncate">{[guide.destinationName,guide.country!==guide.destinationName?guide.country:''].filter(Boolean).join(', ')}</span></p>
   <h3 className="min-h-12 text-lg font-semibold leading-6 tracking-tight"><Link href={href} className="line-clamp-2 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{guide.name}</Link></h3>
   <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">{guide.description||'Discover the places and practical advice collected in this guide.'}</p>
   <div className="flex flex-wrap gap-1.5">{guide.categories.slice(0,2).map(category=><span key={category.id} className="max-w-full truncate rounded-full bg-muted/70 px-2.5 py-1 text-[11px] text-muted-foreground">{category.name}</span>)}</div>
   <div className="mt-auto flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground"><div className="min-w-0 flex-1"><GuideAuthor author={guide.author}/></div><Button variant="ghost" size="icon-sm" aria-label={`Share ${guide.name}`} onClick={()=>void share()}><Share2 aria-hidden="true" className="size-4"/></Button><SaveButton guide={{id:guide.id,source}} className="size-9 shrink-0"/></div>
   <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Eye aria-hidden="true" className="size-3.5"/>{(guide.viewCount??0).toLocaleString()} views</span><span className="inline-flex items-center gap-1.5"><Star className="size-3.5 text-rating" aria-hidden="true"/>{guide.ratingAverage?`${guide.ratingAverage.toFixed(1)} (${guide.ratingCount??0})`:'Not rated yet'}</span>{guide.discoveryLabel&&<span className="text-[11px] text-muted-foreground">{guide.discoveryLabel==='trending'?'Trending':guide.discoveryLabel==='popular'?'Popular pick':'Recently published'}</span>}</div>
  </div>
 </article>;
}
