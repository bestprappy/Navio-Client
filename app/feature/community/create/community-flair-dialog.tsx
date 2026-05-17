"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";

import type { CommunityFlair, CommunityGroup } from "../_components/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FLAIR_SOLID_CLASSES: Record<CommunityFlair["tone"], string> = {
  reliable: "bg-success text-success-foreground",
  question: "bg-info text-info-foreground",
  unsourced: "bg-destructive text-destructive-foreground",
  speculation: "bg-warning text-warning-foreground",
  itinerary: "bg-primary text-primary-foreground",
  food: "bg-warning text-warning-foreground",
  ev: "bg-success text-success-foreground",
};

type CommunityFlairDialogProps = {
  group: CommunityGroup;
  selectedFlairId: string | null;
  onConfirm: (flairId: string | null) => void;
  onClose: () => void;
};

export function CommunityFlairDialog({
  group,
  selectedFlairId,
  onConfirm,
  onClose,
}: CommunityFlairDialogProps) {
  const [search, setSearch] = useState("");
  const [localFlairId, setLocalFlairId] = useState<string | null>(selectedFlairId);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const filteredFlairs = search
    ? group.postFlairs.filter((f) =>
        f.label.toLowerCase().includes(search.toLowerCase()),
      )
    : group.postFlairs;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flair-dialog-title"
        tabIndex={-1}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl outline-none"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="flair-dialog-title"
            className="text-lg font-extrabold text-foreground"
          >
            Add flair and tags
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mb-2 text-xs font-semibold text-foreground">
          {group.name} flair{" "}
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </p>

        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search flairs"
          />
        </div>

        <fieldset className="space-y-2.5">
          <legend className="sr-only">Select a flair</legend>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="flair"
              value=""
              checked={localFlairId === null}
              onChange={() => setLocalFlairId(null)}
              className="accent-primary"
            />
            <span className="text-sm font-medium text-foreground">No flair</span>
          </label>

          {filteredFlairs.map((flair) => (
            <label key={flair.id} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="flair"
                value={flair.id}
                checked={localFlairId === flair.id}
                onChange={() => setLocalFlairId(flair.id)}
                className="accent-primary"
              />
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                  FLAIR_SOLID_CLASSES[flair.tone],
                )}
              >
                {flair.label}
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          className="mt-3 text-xs font-semibold text-foreground underline underline-offset-2 hover:text-muted-foreground"
        >
          View all flairs
        </button>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onConfirm(localFlairId);
              onClose();
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </>
  );
}
