"use client";

import { useMemo } from "react";
import { Check, Plus } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { NoteContent } from "@/components/block-editor/note-content";
import { Button } from "@/components/ui/button";

import { plannerReadOnlyAtom } from "../overview/trip-builder.atoms";
import { usePlaceDetails } from "../place/use-place-details";
import type { DestinationGuide, GuidePlace } from "./destination-guide";
import { guidePlaceElementId } from "./guide-dom";
import { GuideDocumentCard, GuidePlaceTagList } from "./guide-document-card";
import { useIsPlaceInDay } from "./guide-place-photo";
import { GuideSectionHeading, guideSectionElementId } from "./guide-section-list";
import { addGuidePlaceToDayAtom } from "./guide.atoms";

type GuideDocumentProps = {
  guide: DestinationGuide;
  blockId: string;
  dayLabel: string;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
};

/**
 * The guide as its writer laid it out: section headings, the same place cards
 * as the guide editor, and the formatted text between them, at the editor's
 * reading size.
 */
export function GuideDocument({ guide, blockId, dayLabel, selectedPlaceId, onSelectPlace }: GuideDocumentProps) {
  const sectionsById = useMemo(() => new Map(guide.sections.map((section) => [section.id, section])), [guide.sections]);

  return (
    <div className="flex flex-col gap-4">
      {(guide.document ?? []).map((block, index) => {
        if (block.kind === "text") {
          return <NoteContent key={index} content={block.markdown} mode="readonly" size="reading" />;
        }
        const section = sectionsById.get(block.sectionId);
        if (!section) return null;
        if (block.kind === "section") {
          return (
            <section key={index} id={guideSectionElementId(section.id)} aria-labelledby={`${guideSectionElementId(section.id)}-title`} className={index > 0 ? "scroll-mt-16 pt-6" : "scroll-mt-16"}>
              <GuideSectionHeading
                section={section}
                titleId={`${guideSectionElementId(section.id)}-title`}
                count={`${section.places.length} ${section.places.length === 1 ? "place" : "places"}`}
              />
            </section>
          );
        }
        const place = section.places.find((entry) => entry.id === block.placeId);
        if (!place) return null;
        return (
          <div key={index} id={guidePlaceElementId(place.id)} className="scroll-mt-16">
            <GuideDocumentCard
              place={place}
              number={block.number}
              colorId={section.colorId}
              selected={selectedPlaceId === place.id}
              onSelect={() => onSelectPlace(place.id)}
              footerStart={<GuidePlaceTagList tags={place.tags} />}
            >
              <AddToDayButton place={place} blockId={blockId} dayLabel={dayLabel} />
            </GuideDocumentCard>
          </div>
        );
      })}
    </div>
  );
}

type AddToDayButtonProps = {
  place: GuidePlace;
  blockId: string;
  dayLabel: string;
};

function AddToDayButton({ place, blockId, dayLabel }: AddToDayButtonProps) {
  const readOnly = useAtomValue(plannerReadOnlyAtom);
  const isInDay = useIsPlaceInDay(blockId, place.id);
  const addToDay = useSetAtom(addGuidePlaceToDayAtom);
  const live = usePlaceDetails(place.id).data;
  if (readOnly) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant={isInDay ? "secondary" : "default"}
      disabled={isInDay}
      aria-label={isInDay ? `${place.name} is already in ${dayLabel}` : `Add ${place.name} to ${dayLabel}`}
      onClick={() => addToDay({ blockId, place: { ...place, imageUrl: live?.imageUrl, rating: live?.rating, reviewCount: live?.reviewCount } })}
    >
      {isInDay ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {isInDay ? `In ${dayLabel}` : `Add to ${dayLabel}`}
    </Button>
  );
}
