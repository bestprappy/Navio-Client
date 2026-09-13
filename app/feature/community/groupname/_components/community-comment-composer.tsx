"use client";

import type { FormEvent } from "react";
import { ImageIcon, Type } from "lucide-react";

import { CommunityQueryError } from "../../_components/community-query-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommunityCommentComposerProps = {
  id: string;
  value: string;
  placeholder: string;
  submitLabel: string;
  pendingLabel?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  pending?: boolean;
  error?: Error | null;
};

export function CommunityCommentComposer({
  id,
  value,
  placeholder,
  submitLabel,
  pendingLabel = "Posting…",
  onChange,
  onSubmit,
  onCancel,
  onFocus,
  autoFocus = false,
  pending = false,
  error = null,
}: CommunityCommentComposerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!value.trim() || pending) {
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
        onFocus={onFocus}
        disabled={pending}
        maxLength={10000}
        className="min-h-16 resize-y border-0 bg-transparent px-1.5 py-2 leading-6 shadow-none focus-visible:ring-0"
      />

      {error ? (
        <div className="mt-3">
          <CommunityQueryError error={error} />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Attach image"
            title="Image attachments are not available yet"
            disabled
          >
            <ImageIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Add GIF"
            title="GIF attachments are not available yet"
            disabled
            className="px-2 text-[11px] font-semibold uppercase"
          >
            GIF
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Format text"
            title="Rich text formatting is not available yet"
            disabled
          >
            <Type className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={!value.trim() || pending}>
            {pending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
