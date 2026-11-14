"use client";

import type { FocusEvent, FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type CommentComposerProps = {
  id: string;
  value: string;
  placeholder: string;
  submitLabel: string;
  pendingLabel?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  autoFocus?: boolean;
  pending?: boolean;
  maxLength?: number;
  /** Shows "used/max" instead of the keyboard hint when the limit is short. */
  showCount?: boolean;
  /** Error UI supplied by the caller so each feature keeps its own messages. */
  error?: ReactNode;
};

/** Comment and reply box shared by every comment section. */
export function CommentComposer({
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
  maxLength = 10000,
  showCount = false,
  error,
}: CommentComposerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!value.trim() || pending) {
      return;
    }

    onSubmit();
  }

  return (
    <form
      className="rounded-2xl border border-border bg-card p-2.5 shadow-xs transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20"
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
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        disabled={pending}
        maxLength={maxLength}
        className="min-h-16 resize-y border-0 bg-transparent px-1.5 py-2 leading-6 shadow-none focus-visible:ring-0"
      />

      {error ? <div className="mt-3">{error}</div> : null}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        {showCount ? (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {value.length}/{maxLength}
          </span>
        ) : (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {value.trim() ? "Ctrl + Enter to send" : ""}
          </span>
        )}
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={!value.trim() || pending} className="rounded-full px-4 font-bold">
            {pending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
