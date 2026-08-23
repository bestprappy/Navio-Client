"use client";

import type { FormEvent } from "react";
import { ImageIcon, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommunityCommentComposerProps = {
  id: string;
  value: string;
  placeholder: string;
  submitLabel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function CommunityCommentComposer({
  id,
  value,
  placeholder,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
  autoFocus = false,
}: CommunityCommentComposerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!value.trim()) {
      return;
    }

    onSubmit();
  }

  return (
    <form
      className="rounded-2xl border border-border bg-card p-3 shadow-xs"
      onSubmit={handleSubmit}
    >
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-h-16 resize-y border-0 bg-transparent px-1.5 py-2 leading-6 shadow-none focus-visible:ring-0"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Attach image"
          >
            <ImageIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Add GIF"
            className="px-2 text-[11px] font-semibold uppercase"
          >
            GIF
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Format text"
          >
            <Type className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={!value.trim()}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
