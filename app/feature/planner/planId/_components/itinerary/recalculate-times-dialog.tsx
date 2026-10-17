"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatTimeLabel, type ReplacedTime } from "./day-timing";

type RecalculateTimesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replaced: readonly ReplacedTime[];
  /** The list changed while it was open; the traveller is looking at the new one. */
  changedSinceOpened: boolean;
  onConfirm: () => void;
};

/** The one place edited times can be replaced, so it says exactly which ones. */
export function RecalculateTimesDialog({ open, onOpenChange, replaced, changedSinceOpened, onConfirm }: RecalculateTimesDialogProps) {
  const count = replaced.length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Replace {count === 1 ? "1 edited time" : `${count} edited times`}?</DialogTitle>
          <DialogDescription>
            Recalculating all times replaces the times you set below. You can undo this afterwards.
          </DialogDescription>
        </DialogHeader>
        {changedSinceOpened ? (
          <p role="status" className="rounded-md bg-warning/10 px-3 py-2 text-xs text-foreground">
            The day changed while this was open. Check the updated list.
          </p>
        ) : null}
        <ul className="-mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1" aria-label="Times that will be replaced">
          {replaced.map((entry) => (
            <li key={entry.itemId} className="rounded-md bg-muted/60 px-3 py-2">
              <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs tabular-nums text-muted-foreground">
                <span className="line-through decoration-muted-foreground/60">
                  <span className="sr-only">From </span>{formatTimeLabel(entry.from.time, entry.from.timeEnd)}
                </span>
                <ArrowRight className="size-3" aria-hidden="true" />
                <span className="font-medium text-foreground">
                  <span className="sr-only">to </span>{formatTimeLabel(entry.to.time, entry.to.timeEnd)}
                </span>
              </p>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button type="button" onClick={onConfirm}>Replace and calculate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
