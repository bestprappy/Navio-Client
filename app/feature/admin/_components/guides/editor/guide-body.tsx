"use client";

import { useCallback } from "react";
import { useSetAtom } from "jotai";

import { BlockEditor } from "@/components/block-editor/block-editor";

import { guideTextEditorAtom } from "../guides.atoms";
import { useGuideEditor } from "./guide-editor-context";
import { GUIDE_EMBEDS } from "./place-list-embed";

/** The guide's text, written like a note. Place lists come through "/", place cards from a list or the map. */
export function GuideBody() {
  const { updateGuide, guide } = useGuideEditor("GuideBody");
  const setTextEditor = useSetAtom(guideTextEditorAtom);
  const handleChange = useCallback((body: string) => updateGuide((current) => ({ ...current, body })), [updateGuide]);

  return (
    <BlockEditor.Root
      value={guide.body}
      onChange={handleChange}
      label={`${guide.name} guide`}
      placeholder="Write about the destination. Type / to add a place list."
      embeds={GUIDE_EMBEDS}
      size="reading"
      onEditorReady={setTextEditor}
      // The block handles sit in the page margin, so the text lines up with the title.
      className="-ml-5 sm:-ml-(--note-margin)"
    >
      <BlockEditor.Gutter />
      <BlockEditor.Content />
      <BlockEditor.SlashMenu />
      <BlockEditor.BubbleToolbar />
      <BlockEditor.BlockMenu />
    </BlockEditor.Root>
  );
}
