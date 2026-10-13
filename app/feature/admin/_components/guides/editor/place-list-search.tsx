"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAtom, useSetAtom } from "jotai";
import { MapPin, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { activeGuideListAtom, focusListSearchAtom, guidePlaceCandidateAtom } from "../guides.atoms";
import { useGuideEditor } from "./guide-editor-context";
import { PlaceSearchField, type PlaceSearchFieldHandle } from "./place-search-field";
import { ADD_PLACE_ERRORS, useAddGuidePlace } from "./use-add-guide-place";

type PlaceListSearchProps = {
  listId: string;
  categoryName: string;
};

/**
 * A list's own search. A picked place is previewed here and on the map until
 * it is added, as a card at the end of the list, or dismissed.
 */
export function PlaceListSearch({ listId, categoryName }: PlaceListSearchProps) {
  const { guide } = useGuideEditor("PlaceListSearch");
  const addPlace = useAddGuidePlace();
  const fieldRef = useRef<PlaceSearchFieldHandle>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [candidate, setCandidate] = useAtom(guidePlaceCandidateAtom);
  const [focusListId, setFocusListId] = useAtom(focusListSearchAtom);
  const setActiveList = useSetAtom(activeGuideListAtom);
  const ownCandidate = candidate?.listId === listId && candidate.from === "search" ? candidate.place : null;

  useEffect(() => {
    // A list just added from the slash menu starts with its search focused.
    if (focusListId !== listId) return;
    fieldRef.current?.focus();
    setFocusListId(null);
  }, [focusListId, listId, setFocusListId]);

  useEffect(() => {
    if (ownCandidate) addButtonRef.current?.focus({ preventScroll: true });
  }, [ownCandidate]);

  function addCandidate() {
    if (!ownCandidate) return;
    const result = addPlace(listId, ownCandidate);
    if (result !== "added") {
      setAddError(ADD_PLACE_ERRORS[result]);
      return;
    }
    setAddError(null);
    fieldRef.current?.clear();
    fieldRef.current?.focus();
  }

  function dismissCandidate() {
    setCandidate(null);
    setAddError(null);
    fieldRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <PlaceSearchField
        handleRef={fieldRef}
        destination={guide.destination}
        label={`Find a place in ${guide.name} for ${categoryName}`}
        placeholder={`Find a place in ${guide.name} to add`}
        onFocus={() => setActiveList(listId)}
        onEscape={() => (ownCandidate ? dismissCandidate() : undefined)}
        onPick={(place) => {
          setAddError(null);
          setCandidate({ listId, place, from: "search" });
        }}
      />

      {ownCandidate ? (
        <div role="group" aria-label={`${ownCandidate.name}, ready to add`} className="flex items-center gap-3 rounded-xl bg-card p-2 pr-3 ring-1 ring-foreground/10">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            {ownCandidate.imageUrl ? (
              <Image src={ownCandidate.imageUrl} alt="" fill sizes="3.5rem" unoptimized className="object-cover" />
            ) : (
              <MapPin aria-hidden="true" className="absolute inset-0 m-auto size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{ownCandidate.name}</p>
            <p className="truncate text-xs text-muted-foreground">{ownCandidate.address || "Pinned on the map"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button ref={addButtonRef} type="button" size="sm" onClick={addCandidate}>
              <Plus aria-hidden="true" />
              Add to list
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Dismiss ${ownCandidate.name}`} onClick={dismissCandidate}>
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
      {addError ? (
        <p role="alert" className="text-sm text-destructive">
          {addError}
        </p>
      ) : null}
    </div>
  );
}
