"use client";

import { useRef } from "react";

import { CountryFlag } from "@/components/ui/country-flag";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { GuideCoverPhoto } from "../guide-cover-photo";
import { NAVIO_TEAM } from "../guide-to-destination";
import { useGuideEditor } from "./guide-editor-context";

/** The banner: the cover place's live photo, edge to edge. */
export function GuideBanner() {
  const { guide, updateGuide } = useGuideEditor("GuideBanner");
  const choices = [{ id: `${guide.destination.provider}:${guide.destination.providerPlaceId}`, name: guide.destination.name }, ...Object.values(guide.places)];
  return <div className="relative">
    <GuideCoverPhoto placeId={guide.coverPlaceId} sizes="(min-width: 1024px) 60vw, 100vw" priority className="h-48 w-full sm:h-64" />
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="sm" className="absolute right-4 bottom-4" />}>Change cover</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {choices.map((place) => <DropdownMenuItem key={place.id} onClick={() => updateGuide((current) => ({ ...current, coverPlaceId: place.id }))}>{place.name}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}

/** The guide's title and description, edited in place as readers will see them. */
export function GuideHeading() {
  const { guide, updateGuide } = useGuideEditor("GuideHeading");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground">
        <p className="flex items-center gap-2">
          <CountryFlag code={guide.countryCode} className="size-6 rounded-md bg-transparent [&_.fi]:size-4" />
          {guide.country || "Country unknown"}
        </p>
        <p className="flex items-center gap-1.5">
          <Logo className="size-4" />
          By the {NAVIO_TEAM}
        </p>
      </div>
        <textarea
          aria-label="Guide title"
          maxLength={120}
          value={guide.name}
          rows={1}
          placeholder="Untitled guide"
          onChange={(event) => {
            const name = event.target.value.replace(/\s*\n\s*/g, " ");
            updateGuide((current) => ({ ...current, name }));
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            descriptionRef.current?.focus();
          }}
          className="-mx-2 field-sizing-content w-[calc(100%+1rem)] resize-none rounded-lg bg-transparent px-2 text-4xl leading-tight font-extrabold tracking-tight text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 hover:bg-muted/40 focus-visible:bg-muted/60 sm:text-5xl"
        />
        <textarea
          ref={descriptionRef}
          aria-label="Guide description"
          maxLength={4000}
          value={guide.description}
          rows={2}
          placeholder="What is this place known for, and how do people get around? Two or three sentences."
          onChange={(event) => updateGuide((current) => ({ ...current, description: event.target.value }))}
          className="-mx-2 field-sizing-content min-h-14 w-[calc(100%+1rem)] resize-none rounded-lg bg-transparent px-2 py-1 text-base leading-7 text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground/60 hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:text-foreground"
        />
    </div>
  );
}
