"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { AdminPaletteColor } from "./palette-api";

type DeleteColorDialogProps = {
  color: AdminPaletteColor | null;
  /** The color everything saved with the deleted one switches to. */
  defaultColorName: string;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (color: AdminPaletteColor) => void;
};

/** Confirms a permanent delete and says exactly what happens to colors already in use. */
export function DeleteColorDialog({ color, defaultColorName, isDeleting, onOpenChange, onConfirm }: DeleteColorDialogProps) {
  return (
    <Dialog open={color !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        {color ? (
          <>
            <DialogHeader className="flex-row items-center gap-3">
              <span aria-hidden="true" className="size-10 shrink-0 rounded-full shadow-xs" style={{ backgroundColor: color.hex }} />
              <DialogTitle>Delete {color.name} permanently?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Trips, guides and shared plans that use {color.name} switch to {defaultColorName}, the default color. This can’t be undone.
            </DialogDescription>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button
                type="button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40"
                disabled={isDeleting}
                onClick={() => onConfirm(color)}
              >
                <Trash2 aria-hidden="true" />
                {isDeleting ? "Deleting…" : "Delete permanently"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
