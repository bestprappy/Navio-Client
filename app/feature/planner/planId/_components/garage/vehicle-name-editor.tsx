"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type VehicleNameEditorProps = {
  titleId: string;
  carName: string;
  nickname?: string;
  disabled?: boolean;
  /** Called with the new nickname; an empty string clears it and shows the car name again. */
  onRename: (nickname: string) => void;
};

/** The vehicle title, renamed in place. A nickname keeps the real car name visible as a tag. */
export function VehicleNameEditor({ titleId, carName, nickname, disabled = false, onRename }: VehicleNameEditorProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const isEditing = draft !== null;

  function save() {
    if (draft === null) return;
    const next = draft.trim();
    // Typing the car name back, or clearing the field, removes the nickname.
    const normalized = next === carName ? "" : next;
    setDraft(null);
    if (normalized !== (nickname ?? "")) onRename(normalized);
  }

  if (isEditing) {
    return (
      <form
        className="mt-0.5 flex items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Input
          autoFocus
          aria-label="Vehicle name"
          maxLength={100}
          value={draft}
          placeholder={carName}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setDraft(null);
            }
          }}
          className="h-9 text-base font-semibold"
        />
        <Button type="submit" variant="ghost" size="icon" aria-label="Save name" className="shrink-0 text-primary">
          <Check aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Cancel renaming" className="shrink-0" onClick={() => setDraft(null)}>
          <X aria-hidden="true" />
        </Button>
      </form>
    );
  }

  return (
    <div className="mt-0.5 min-w-0">
      <div className="flex min-w-0 items-center gap-1">
        <h3 id={titleId} className="min-w-0 wrap-break-word text-lg font-bold leading-snug text-foreground">
          {nickname || carName}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={`Rename ${nickname || carName}`}
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setDraft(nickname || carName)}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      {nickname ? (
        <span className="mt-1 inline-flex max-w-full rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          <span className="truncate">{carName}</span>
        </span>
      ) : null}
    </div>
  );
}
