"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { useAtomValue, useSetAtom, useStore } from "jotai";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { tripBlocksAtom } from "../overview/trip-builder.atoms";
import { usePlaceDetails } from "../place/use-place-details";
import type { DestinationGuide, GuideListAction, GuideSectionId } from "./destination-guide";
import { formatGuideDayLabel, revealGuidePlaceCard } from "./guide-dom";
import { GuidePlacePhoto, GuideSectionIcon, guideSectionTint } from "./guide-place-photo";
import { GuideDocument } from "./guide-document";
import { GuideSectionList, guideSectionElementId } from "./guide-section-list";
import {
  activeGuideAtom,
  changeGuideListAtom,
  closeGuideBrowserAtom,
  guideBrowseAtom,
  selectedGuidePlaceIdAtom,
  selectGuidePlaceAtom,
  visibleGuideSectionsAtom,
} from "./guide.atoms";

function GuideHero({ guide, headingRef }: { guide: DestinationGuide; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const cover = usePlaceDetails(guide.coverPlaceId);
  const coverSection = guide.sections[0];
  return (
    <div className="relative isolate h-56 overflow-hidden @md/planner:h-72">
      {coverSection ? (
        <GuidePlacePhoto
          section={coverSection}
          imageUrl={cover.data?.imageUrl}
          isLoading={cover.isLoading}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="absolute inset-0 -z-10 size-full"
        />
      ) : null}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-scrim/85 via-scrim/25 to-transparent" />
      <div className="flex h-full flex-col justify-end gap-1 p-5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-on-media/85">
          <MapPin className="size-4" aria-hidden="true" />
          {guide.country}
        </p>
        <h1 id="guide-title" ref={headingRef} tabIndex={-1} className="text-5xl leading-none font-extrabold tracking-tight text-on-media outline-none">
          {guide.name}
        </h1>
        {guide.author ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-on-media/90">
            <Logo className="size-4 text-on-media" />
            By the {guide.author}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Replaces the planning drawer while a destination guide is open. */
export function GuideBrowserPanel() {
  const guide = useAtomValue(activeGuideAtom);
  const browse = useAtomValue(guideBrowseAtom);
  const sections = useAtomValue(visibleGuideSectionsAtom);
  const selectedPlaceId = useAtomValue(selectedGuidePlaceIdAtom);
  const block = useAtomValue(tripBlocksAtom).find((entry) => entry.id === browse?.blockId);
  const close = useSetAtom(closeGuideBrowserAtom);
  const selectPlace = useSetAtom(selectGuidePlaceAtom);
  const changeList = useSetAtom(changeGuideListAtom);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isMissing = !guide || !block;

  useEffect(() => {
    // The day was deleted or the guide no longer exists: go back to the plan.
    if (isMissing) close();
  }, [close, isMissing]);

  const store = useStore();
  const guideId = guide?.id;
  useEffect(() => {
    // Focus the title when the guide opens, unless it opened on a chosen place.
    if (guideId && !store.get(selectedGuidePlaceIdAtom)) headingRef.current?.focus({ preventScroll: true });
  }, [guideId, store]);

  const handleChangeList = useCallback(
    (sectionId: GuideSectionId, action: GuideListAction) => changeList({ sectionId, action }),
    [changeList],
  );

  if (isMissing || !browse) return null;
  const dayLabel = formatGuideDayLabel(block.date);

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) close();
      }}
    >
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-3 py-2 backdrop-blur-sm">
        <Button type="button" variant="ghost" size="sm" onClick={close}>
          <ArrowLeft aria-hidden="true" />
          Back to planning
        </Button>
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          Adding to <span className="font-medium text-foreground">{dayLabel}</span>
        </p>
      </div>

      <article aria-labelledby="guide-title">
        <GuideHero guide={guide} headingRef={headingRef} />

        <div className="space-y-8 px-4 pt-5 pb-16">
          <div className="space-y-4">
            <p className="max-w-prose text-base leading-7 text-muted-foreground">{guide.description}</p>
            <nav aria-label={`${guide.name} guide sections`} className="flex flex-wrap gap-2">
              {guide.sections.map((section) => {
                return (
                  <Button
                    key={section.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => document.getElementById(guideSectionElementId(section.id))?.scrollIntoView({ block: "start" })}
                  >
                    <GuideSectionIcon section={section} style={{ color: guideSectionTint(section).color }} />
                    {section.title}
                  </Button>
                );
              })}
            </nav>
          </div>

          {guide.document ? (
            <GuideDocument
              guide={guide}
              blockId={browse.blockId}
              dayLabel={dayLabel}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={(placeId) => {
                selectPlace(placeId);
                revealGuidePlaceCard(placeId);
              }}
            />
          ) : sections.map((section, index) => (
            <div key={section.id} className="space-y-8">
              {index > 0 && <Separator />}
              <GuideSectionList
                section={section}
                blockId={browse.blockId}
                dayLabel={dayLabel}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={(placeId) => {
                  selectPlace(placeId);
                  revealGuidePlaceCard(placeId);
                }}
                onChangeList={handleChangeList}
              />
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
