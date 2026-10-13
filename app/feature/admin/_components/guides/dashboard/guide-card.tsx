"use client";

import Link from "next/link";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { CategoryIcon } from "../category-icon";
import { GuideCoverPhoto } from "../guide-cover-photo";
import type { GuideSummary } from "../guides-api";

function formatEdited(updatedAt: string): string {
  const date = parseISO(updatedAt);
  return isValid(date) ? `Edited ${formatDistanceToNow(date, { addSuffix: true })}` : "Edited recently";
}

/** A guide on the dashboard: its cover with the destination set on it. */
export function GuideCard({ guide }: { guide: GuideSummary }) {
  const { categories, placeCount } = guide;

  return (
    <Link
      href={`/admin/guides/${guide.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-2xs ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
    >
      <div className="relative isolate aspect-4/3">
        <GuideCoverPhoto placeId={guide.coverPlaceId} sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw" className="absolute inset-0 -z-10 size-full" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-scrim/80 via-scrim/10 to-transparent" />
        <h3 className="absolute inset-x-4 bottom-3 text-2xl leading-tight font-bold tracking-tight text-on-media">{guide.name}</h3>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Badge variant={guide.status === "PUBLISHED" ? "default" : "secondary"}>{guide.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
        {categories.length ? (
          <ul aria-label="Categories" className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5 text-xs font-medium">
                <CategoryIcon category={category} size="sm" className="rounded-full" />
                {category.name}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5" />
            <span className="font-mono tabular-nums text-foreground">{placeCount}</span>
            {placeCount === 1 ? "place" : "places"}
          </span>
          <span>{formatEdited(guide.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
