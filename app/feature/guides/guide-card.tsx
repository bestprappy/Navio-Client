"use client";

import Link from "next/link";
import { BookOpen, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GuideCoverPhoto } from "../admin/_components/guides/guide-cover-photo";
import type { GuideSummary } from "../admin/_components/guides/guides-api";
import type { PublishedGuideSummary } from "./user-guides-api";
import { GuideAuthor } from "./guide-author";
import { cn } from "@/lib/utils";

export function TravelerGuideCard({
  guide,
  layout = "default",
}: {
  guide: PublishedGuideSummary;
  layout?: "default" | "planner";
}) {
  const isPlanner = layout === "planner";

  return (
    <Link
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
    </Link>
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
