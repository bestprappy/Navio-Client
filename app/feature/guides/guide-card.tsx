"use client";

import Link from "next/link";
import { BookOpen, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GuideCoverPhoto } from "../admin/_components/guides/guide-cover-photo";
import type { GuideSummary } from "../admin/_components/guides/guides-api";
import type { PublishedGuideSummary } from "./user-guides-api";
import { GuideAuthor } from "./guide-author";

export function TravelerGuideCard({ guide }: { guide: PublishedGuideSummary }) {
  return (
    <Link
      href={`/explore/guides/${guide.id}`}
      className="group flex h-full min-w-0 flex-col gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <GuideCoverPhoto
        placeId={guide.coverPlaceId}
        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 90vw"
        className="aspect-3/2 w-full rounded-xl"
      />
      <div className="space-y-2 px-1 pb-1">
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
        <h3 className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight group-hover:text-primary">
          {guide.name}
        </h3>
        {guide.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {guide.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
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
