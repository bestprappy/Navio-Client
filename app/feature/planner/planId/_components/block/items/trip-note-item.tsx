"use client";

import { type ChangeEvent, useEffect, useRef } from "react";
import { FileText, X } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";

import type { NoteItem } from "../../constants/types";
import {
  plannerReadOnlyAtom,
  removeItemFromBlockAtom,
  updateNoteItemAtom,
} from "../../overview/trip-builder.atoms";

type TripNoteItemProps = {
  blockId: string;
  item: NoteItem;
};

export function TripNoteItem({ blockId, item }: TripNoteItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNoteItem = useSetAtom(updateNoteItemAtom);
  const removeItemFromBlock = useSetAtom(removeItemFromBlockAtom);
  const readOnly = useAtomValue(plannerReadOnlyAtom);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [item.content]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    updateNoteItem({
      blockId,
      itemId: item.id,
      content: event.target.value,
    });
  }

  if (readOnly) {
    return (
      <article className="rounded-sm border border-border bg-card p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="min-w-0 flex-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground">{item.content}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-sm border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <FileText
          className="mt-2 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <textarea
          ref={textareaRef}
          value={item.content}
          onChange={handleChange}
          placeholder="Write or paste notes here"
          aria-label="Trip note"
          rows={1}
          className="min-h-10 flex-1 resize-none overflow-hidden bg-transparent py-1 text-sm leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
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
