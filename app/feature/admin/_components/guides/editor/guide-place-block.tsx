"use client";

import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useAtom, useSetAtom } from "jotai";
import { MapPinPlus, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { GuideDocumentCard } from "../../../../planner/planId/_components/guide/guide-document-card";
import {
  MAX_PLACE_TAGS,
  MAX_TAG_LENGTH,
  addPlaceTag,
  findCategory,
  findOutlinePlace,
  listIdOfCard,
  placeFromSearchResult,
  placeKey,
  rememberPlace,
  removePlaceTag,
  sectionHasPlace,
} from "../guide-model";
import { activeGuideListAtom, selectedGuidePlaceAtom } from "../guides.atoms";
import { useGuideEditor } from "./guide-editor-context";
import { PlaceSearchField, type PlaceSearchFieldHandle } from "./place-search-field";

/** Cards made from the slash menu in this session; each takes focus once, when it mounts. */
const freshCards = new Set<string>();

/** The id of a card that has no place yet; it becomes the place's id once one is chosen. */
export function createEmptyPlaceCardId(): string {
  const id = `pending-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;
  freshCards.add(id);
  return id;
}

export function guidePlaceElementId(key: string): string {
  return `guide-place-${key}`;
}

/** A place in the guide's text: the planner's place card, numbered within its list. */
export function GuidePlaceNodeView({ node, deleteNode, updateAttributes, selected: blockSelected }: ReactNodeViewProps) {
  const key = typeof node.attrs.placeId === "string" ? node.attrs.placeId : "";
  return (
    <NodeViewWrapper id={key ? guidePlaceElementId(key) : undefined}>
      <GuidePlaceCard
        placeKey={key}
        blockSelected={blockSelected}
        onRemove={deleteNode}
        onChoosePlace={(placeId) => updateAttributes({ placeId })}
      />
    </NodeViewWrapper>
  );
}

type GuidePlaceCardProps = {
  placeKey: string;
  blockSelected: boolean;
  onRemove: () => void;
  onChoosePlace: (placeKey: string) => void;
};

function GuidePlaceCard({ placeKey, blockSelected, onRemove, onChoosePlace }: GuidePlaceCardProps) {
  const { guide, sections } = useGuideEditor("GuidePlaceCard");
  const [selected, setSelected] = useAtom(selectedGuidePlaceAtom);
  const setActiveList = useSetAtom(activeGuideListAtom);
  const cardRef = useRef<HTMLDivElement>(null);
  const place = guide.places[placeKey];
  const location = findOutlinePlace(sections, placeKey);
  const isSelected = selected?.key === placeKey;
  const revealed = isSelected && selected.from === "map";

  useEffect(() => {
    if (revealed) cardRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [revealed]);

  if (!place) return <EmptyPlaceCard cardId={placeKey} onChoosePlace={onChoosePlace} onRemove={onRemove} />;

  const category = findCategory(guide, location?.section.categoryId ?? null);
  const select = () => {
    setSelected({ key: placeKey, from: "text" });
    setActiveList(location?.section.listId ?? null);
  };

  return (
    <div ref={cardRef}>
      <GuideDocumentCard
        place={place}
        number={location?.entry.number ?? null}
        colorId={category?.colorId ?? "slate"}
        selected={isSelected || blockSelected}
        onSelect={select}
        footerStart={<EditablePlaceTags placeKey={placeKey} placeName={place.name} tags={place.tags} />}
      />
    </div>
  );
}

type EditablePlaceTagsProps = {
  placeKey: string;
  placeName: string;
  tags: readonly string[];
};

/** The card's tags as travelers will see them, each removable, with a field to add one. */
function EditablePlaceTags({ placeKey, placeName, tags }: EditablePlaceTagsProps) {
  const { updateGuide } = useGuideEditor("EditablePlaceTags");
  const [draft, setDraft] = useState("");
  const canAdd = tags.length < MAX_PLACE_TAGS;

  function commit() {
    if (!draft.trim()) return;
    updateGuide((current) => addPlaceTag(current, placeKey, draft));
    setDraft("");
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <ul aria-label={`Tags for ${placeName}`} className="contents">
        {tags.map((tag) => (
          <li key={tag}>
            <Badge variant="outline" className="gap-1 pr-0.5 text-muted-foreground">
              {tag}
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() => updateGuide((current) => removePlaceTag(current, placeKey, tag))}
                className="flex size-4 items-center justify-center rounded-full hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          </li>
        ))}
      </ul>
      {canAdd ? (
        <input
          type="text"
          value={draft}
          maxLength={MAX_TAG_LENGTH}
          aria-label={`Add a tag to ${placeName}`}
          placeholder="Add tag"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commit();
            } else if (event.key === "Escape") {
              setDraft("");
            } else if (event.key === "Backspace" && !draft && tags.length) {
              updateGuide((current) => removePlaceTag(current, placeKey, tags[tags.length - 1]));
            }
          }}
          onBlur={commit}
          className="h-6 w-24 min-w-0 rounded-full border border-dashed border-input bg-transparent px-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-solid focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      ) : null}
    </div>
  );
}

type EmptyPlaceCardProps = {
  cardId: string;
  onChoosePlace: (placeKey: string) => void;
  onRemove: () => void;
};

/** A card with no place yet, from "/place": choosing a place fills the card where it stands. */
function EmptyPlaceCard({ cardId, onChoosePlace, onRemove }: EmptyPlaceCardProps) {
  const { guide, sections, updateGuide } = useGuideEditor("EmptyPlaceCard");
  const setSelected = useSetAtom(selectedGuidePlaceAtom);
  const fieldRef = useRef<PlaceSearchFieldHandle>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!freshCards.has(cardId)) return;
    // Consumed only when focus happens, so a re-run effect (Strict Mode) still focuses once.
    const frame = requestAnimationFrame(() => {
      freshCards.delete(cardId);
      fieldRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [cardId]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-input bg-card p-4">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MapPinPlus className="size-4" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium">Choose a place for this card</p>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove this place card" onClick={onRemove}>
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <PlaceSearchField
        handleRef={fieldRef}
        destination={guide.destination}
        label={`Find a place in ${guide.name} for this card`}
        placeholder={`Find a place in ${guide.name}`}
        onEscape={onRemove}
        onPick={(result) => {
          const place = placeFromSearchResult(result);
          const key = placeKey(place);
          if (!key) {
            setError("This place can't be added to a guide.");
            return;
          }
          const listId = listIdOfCard(guide, cardId);
          if (listId && sectionHasPlace(sections, listId, key)) {
            setError(`${place.name} is already in this list.`);
            return;
          }
          // Saved before the card points at it, so the card finds its place as it re-renders.
          updateGuide((current) => rememberPlace(current, place));
          onChoosePlace(key);
          setSelected({ key, from: "text" });
        }}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
