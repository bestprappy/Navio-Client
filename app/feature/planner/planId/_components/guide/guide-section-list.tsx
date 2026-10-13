"use client";

import { ChevronDown, ChevronUp, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  GUIDE_PAGE_SIZE,
  type GuideListAction,
  type GuideSection,
  type GuideSectionId,
  type VisibleGuideSection,
} from "./destination-guide";
import { guidePlaceElementId } from "./guide-dom";
import { GuideSectionIcon, guideSectionTint } from "./guide-place-photo";
import { GuidePlaceCard } from "./guide-place-card";

export function guideSectionElementId(sectionId: GuideSectionId): string {
  return `guide-section-${sectionId}`;
}

type GuideSectionHeadingProps = {
  section: Pick<GuideSection, "id" | "title" | "colorId" | "iconId">;
  titleId: string;
  count: string;
};

/** A guide section's heading: its category icon, name and how many places it lists. */
export function GuideSectionHeading({ section, titleId, count }: GuideSectionHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={titleId} className="flex items-center gap-2.5 text-xl font-bold text-foreground">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={guideSectionTint(section)}>
          <GuideSectionIcon section={section} className="size-4" />
        </span>
        {section.title}
      </h2>
      <p className="shrink-0 text-sm text-muted-foreground">{count}</p>
    </div>
  );
}

type GuideSectionListProps = {
  section: VisibleGuideSection;
  blockId: string;
  dayLabel: string;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  onChangeList: (sectionId: GuideSectionId, action: GuideListAction) => void;
};

export function GuideSectionList({
  section,
  blockId,
  dayLabel,
  selectedPlaceId,
  onSelectPlace,
  onChangeList,
}: GuideSectionListProps) {
  const total = section.places.length;
  const hasHidden = section.visibleCount < total;
  const titleId = `${guideSectionElementId(section.id)}-title`;

  return (
    <section id={guideSectionElementId(section.id)} aria-labelledby={titleId} className="scroll-mt-16 space-y-4">
      <GuideSectionHeading section={section} titleId={titleId} count={`${section.visibleCount} of ${total}`} />

      <ol className="space-y-3">
        {section.visiblePlaces.map((place, index) => (
          <li key={place.id} id={guidePlaceElementId(place.id)} className="scroll-mt-16">
            <GuidePlaceCard
              place={place}
              section={section}
              position={index + 1}
              blockId={blockId}
              dayLabel={dayLabel}
              selected={selectedPlaceId === place.id}
              onSelect={onSelectPlace}
            />
          </li>
        ))}
      </ol>

      {total > GUIDE_PAGE_SIZE ? (
        <div className="flex flex-wrap items-center gap-2">
          {hasHidden ? (
            <>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onChangeList(section.id, "more")}>
                <ChevronDown aria-hidden="true" />
                Show more
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => onChangeList(section.id, "all")}>
                <ListChecks aria-hidden="true" />
                See all {total}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onChangeList(section.id, "less")}>
              <ChevronUp aria-hidden="true" />
              Show less
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}
