"use client";

import { lazy, Suspense, useCallback } from "react";
import { FileText, X } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import type { NoteItem } from "../../constants/types";
import {
  plannerReadOnlyAtom,
  removeItemFromBlockAtom,
  updateNoteItemAtom,
} from "../../overview/trip-builder.atoms";

// The markdown parser and the editor are only needed once a note is on screen,
// so they stay out of the planner's first load.
const NoteEditor = lazy(() =>
  import("@/components/block-editor/note-editor").then((module) => ({ default: module.NoteEditor })),
);
const NoteContent = lazy(() =>
  import("@/components/block-editor/note-content").then((module) => ({ default: module.NoteContent })),
);

const NOTE_ICON = <FileText className="size-4" />;

type TripNoteItemProps = {
  blockId: string;
  item: NoteItem;
};

/** Shown while the note's code loads: the raw text, so nothing jumps far when it is replaced. */
function PlainNoteText({ content, placeholder }: { content: string; placeholder?: string }) {
  return (
    <p className="min-w-0 whitespace-pre-wrap wrap-break-word pl-10 text-sm leading-6 text-foreground">
      {content || <span className="text-muted-foreground">{placeholder}</span>}
    </p>
  );
}

export function TripNoteItem({ blockId, item }: TripNoteItemProps) {
  const updateNoteItem = useSetAtom(updateNoteItemAtom);
  const removeItemFromBlock = useSetAtom(removeItemFromBlockAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);

  const handleChange = useCallback(
    (content: string) => updateNoteItem({ blockId, itemId: item.id, content }),
    [blockId, item.id, updateNoteItem],
  );

  if (readOnly) {
    return (
      <article className="rounded-sm border border-border bg-card p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <Suspense fallback={<p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>}>
              <NoteContent content={item.content} mode="readonly" emptyText="Empty note" />
            </Suspense>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-sm border border-border bg-card py-3 pr-2 pl-1 shadow-xs transition-shadow focus-within:ring-2 focus-within:ring-ring/30">
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <Suspense fallback={<PlainNoteText content={item.content} placeholder="Write a note" />}>
            <NoteEditor
              value={item.content}
              onChange={handleChange}
              label="Trip note"
              placeholder="Write a note, or type / for blocks"
              restingIcon={NOTE_ICON}
            />
          </Suspense>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete note"
          onClick={() => removeItemFromBlock({ blockId, itemId: item.id })}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
