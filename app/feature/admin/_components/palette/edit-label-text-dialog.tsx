"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { LabelTextPicker } from "./label-text-picker";
import type { AdminPaletteColor, TextColors } from "./palette-api";
import { PaletteThemePreview } from "./palette-theme-preview";

type EditLabelTextDialogProps = {
  color: AdminPaletteColor | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (color: AdminPaletteColor, colors: TextColors) => void;
};

/** Changes the label text drawn on an existing color. Its name and hex stay fixed. */
export function EditLabelTextDialog({ color, isSaving, onOpenChange, onSave }: EditLabelTextDialogProps) {
  return (
    <Dialog open={color !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Keyed so each color opens with its own saved choice. */}
        {color ? <EditLabelTextBody key={color.id} color={color} isSaving={isSaving} onSave={onSave} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EditLabelTextBody({ color, isSaving, onSave }: { color: AdminPaletteColor; isSaving: boolean; onSave: EditLabelTextDialogProps["onSave"] }) {
  const [value, setValue] = useState<TextColors>({ textOnLight: color.textOnLight, textOnDark: color.textOnDark });
  const unchanged = value.textOnLight === color.textOnLight && value.textOnDark === color.textOnDark;

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(color, value);
      }}
    >
      <DialogHeader>
        <DialogTitle>Label text on {color.name}</DialogTitle>
        <DialogDescription>Applies everywhere {color.name} is used, including trips and guides saved with it.</DialogDescription>
      </DialogHeader>
      <h3 id="edit-label-text-heading" className="sr-only">Label text</h3>
      <LabelTextPicker hex={color.hex} labelledBy="edit-label-text-heading" value={value} onValueChange={setValue} disabled={isSaving} />
      <PaletteThemePreview hex={color.hex} name={color.name} {...value} />
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={unchanged || isSaving}>{isSaving ? "Saving…" : "Save label text"}</Button>
      </DialogFooter>
    </form>
  );
}
