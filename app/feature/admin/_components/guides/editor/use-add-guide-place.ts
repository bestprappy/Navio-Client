"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { useAtomValue, useSetAtom } from "jotai";

import type { PlaceSearchResult } from "../../../../planner/planId/_components/constants/types";
import { GUIDE_PLACE_EMBED, PLACE_LIST_EMBED, placeFromSearchResult, placeKey, rememberPlace, sectionHasPlace } from "../guide-model";
import { activeGuideListAtom, guidePlaceCandidateAtom, guideTextEditorAtom, selectedGuidePlaceAtom } from "../guides.atoms";
import { useGuideEditor } from "./guide-editor-context";

/**
 * Puts a place card at the end of a list's section: before the next list
 * header, so text written under the section's last card stays with it. An
 * empty line follows the card, ready for text about the place. With no such
 * list the card goes at the end of the guide.
 */
export function insertPlaceCard(editor: Editor, listId: string | null, key: string): boolean {
  const { state } = editor;
  const cardType = state.schema.nodes[GUIDE_PLACE_EMBED.name];
  const paragraphType = state.schema.nodes.paragraph;
  if (!cardType || !paragraphType) return false;

  let offset = 0;
  let inSection = false;
  let insertAt: number | null = null;
  for (let index = 0; index < state.doc.childCount; index += 1) {
    const child = state.doc.child(index);
    if (child.type.name === PLACE_LIST_EMBED.name) {
      if (inSection) {
        insertAt = offset;
        break;
      }
      inSection = child.attrs.listId === listId;
    }
    offset += child.nodeSize;
  }

  const position = insertAt ?? state.doc.content.size;
  editor.view.dispatch(state.tr.insert(position, [cardType.create({ placeId: key }), paragraphType.create()]));
  return true;
}

export type AddPlaceResult = "added" | "duplicate" | "unsupported" | "unavailable";

export const ADD_PLACE_ERRORS: Record<Exclude<AddPlaceResult, "added">, string> = {
  duplicate: "This place is already in that list.",
  unsupported: "This place can't be added to a guide.",
  unavailable: "The guide's text isn't ready yet. Try again in a moment.",
};

/** Adds a found place to a list's section in the text and selects it on the map. */
export function useAddGuidePlace() {
  const { sections, updateGuide } = useGuideEditor("useAddGuidePlace");
  const editor = useAtomValue(guideTextEditorAtom);
  const setCandidate = useSetAtom(guidePlaceCandidateAtom);
  const setSelected = useSetAtom(selectedGuidePlaceAtom);
  const setActiveList = useSetAtom(activeGuideListAtom);

  return useCallback(
    (listId: string | null, result: PlaceSearchResult): AddPlaceResult => {
      const place = placeFromSearchResult(result);
      const key = placeKey(place);
      if (!key) return "unsupported";
      if (listId && sectionHasPlace(sections, listId, key)) return "duplicate";
      if (!editor || editor.isDestroyed) return "unavailable";
      // Saved before the card exists, so the card finds its place as it mounts.
      updateGuide((current) => rememberPlace(current, place));
      if (!insertPlaceCard(editor, listId, key)) return "unavailable";
      setCandidate(null);
      setActiveList(listId);
      setSelected({ key, from: "text" });
      return "added";
    },
    [editor, sections, setActiveList, setCandidate, setSelected, updateGuide],
  );
}
