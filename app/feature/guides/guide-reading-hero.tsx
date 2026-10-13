"use client";

import type { ReactNode, Ref } from "react";
import { MapPin } from "lucide-react";
import { GuideCoverPhoto } from "../admin/_components/guides/guide-cover-photo";

/** The shared cover treatment for Navio team and traveler guide readers. */
export function GuideReadingHero({
  title,
  location,
  coverPlaceId,
  author,
  headingRef,
}: {
  title: string;
  location: string;
  coverPlaceId: string;
  author: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <header className="relative isolate flex min-h-56 flex-col justify-end overflow-hidden sm:min-h-72">
      <GuideCoverPhoto
        placeId={coverPlaceId}
        sizes="(min-width: 1024px) 65vw, 100vw"
        className="absolute inset-0 -z-20 size-full"
        priority
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-scrim/90 via-scrim/40 to-scrim/10" />
      <div className="space-y-2 p-5 sm:p-6">
        <p className="flex items-center gap-1.5 text-sm font-medium text-on-media/85">
          <MapPin aria-hidden="true" className="size-4 shrink-0" />
          {location}
        </p>
        <h1 id="guide-title" ref={headingRef} tabIndex={-1} className="text-3xl leading-tight font-extrabold tracking-tight wrap-anywhere text-on-media outline-none sm:text-4xl xl:text-5xl">
          {title}
        </h1>
        <div className="pt-1 text-sm font-medium text-on-media/90">{author}</div>
      </div>
    </header>
  );
}
