"use client";

import { useId, useMemo, useRef } from "react";
import type { TripResponse } from "@/app/feature/planner/_components/planner-api";
import { atom, useAtom } from "jotai";
import { Check, Loader2, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useTripMetadata,
  useUpdateTripMetadata,
} from "@/app/feature/planner/_components/use-trip-metadata";

type TripNameEditorProps = {
  planId?: string;
  destinationName: string;
  trip?: TripResponse;
  heading?: "h1" | "h2" | "h3";
};

export function TripNameEditor({ planId, destinationName, trip, heading: Heading = "h1" }: TripNameEditorProps) {
  const id = useId();
  const editorAtom = useMemo(() => atom<string | null>(null), []);
  const [draft, setDraft] = useAtom(editorAtom);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const tripQuery = useTripMetadata(planId);
  const renameMutation = useUpdateTripMetadata(planId);
  const currentTrip = tripQuery.data ?? trip;
  const title = currentTrip ? currentTrip.title ?? "Untitled trip" : destinationName;

  function closeEditor() {
    setDraft(null);
    window.requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  if (draft !== null) {
    const trimmedDraft = draft.trim();
    return (
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmedDraft && !renameMutation.isPending) {
            if (trimmedDraft === title) closeEditor();
            else renameMutation.mutate({ displayName: trimmedDraft }, { onSuccess: closeEditor });
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !renameMutation.isPending) {
            event.preventDefault();
            closeEditor();
          }
        }}
      >
        <label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
          Trip name
        </label>
        <Input
          id={id}
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={(event) => event.target.select()}
          maxLength={255}
          required
          disabled={renameMutation.isPending}
          aria-describedby={renameMutation.isError ? `${id}-error` : undefined}
          className="h-12 bg-background text-base font-semibold"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={closeEditor} disabled={renameMutation.isPending}>
            <X className="size-4" aria-hidden="true" />
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!trimmedDraft || renameMutation.isPending}>
            {renameMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            {renameMutation.isPending ? "Saving…" : "Save name"}
          </Button>
        </div>
        {renameMutation.isError && (
          <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
            Your trip name could not be saved. Please try again.
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Heading className="min-w-0 flex-1 break-words text-2xl font-bold leading-tight tracking-tight @lg/planner:text-3xl">
          {title}
        </Heading>
        <Button
          ref={editButtonRef}
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full text-muted-foreground"
          aria-label="Edit trip name"
          title="Edit trip name"
          disabled={!currentTrip}
          onClick={() => {
            renameMutation.reset();
            setDraft(title);
          }}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {tripQuery.isError && (
        <p className="text-xs text-muted-foreground" role="status">
          Trip details are unavailable. {" "}
          <button type="button" className="rounded text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => void tripQuery.refetch()}>
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
