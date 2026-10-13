"use client";

import { useId, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PopoverTitle } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { getTripBlockColorById } from "../../../../planner/planId/_components/constants/trip-block-colors";
import type { TripBlockColorId } from "../../../../planner/planId/_components/constants/types";
import { CategoryIcon } from "../category-icon";
import { GUIDE_ICONS } from "../guide-icons";
import { GUIDE_ICON_IDS, type GuideCategory, type GuideIconId } from "../guide-model";

/** Distinct hues from the planner palette; enough to tell a dozen categories apart on the map. */
export const CATEGORY_COLOR_IDS: readonly TripBlockColorId[] = [
  "blue", "sky", "teal", "emerald", "lime", "gold", "amber", "coral", "rose", "fuchsia", "violet", "slate",
];

const NAME_MAX = 40;

type CategoryFormProps = {
  initial: GuideCategory | null;
  /** Lists in the text using the category; a category in use cannot be deleted. */
  useCount: number;
  onSubmit: (values: Omit<GuideCategory, "id">) => void;
  onDelete?: () => void;
  onCancel: () => void;
};

export function CategoryForm({ initial, useCount, onSubmit, onDelete, onCancel }: CategoryFormProps) {
  const nameId = useId();
  const errorId = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [iconId, setIconId] = useState<GuideIconId>(initial?.iconId ?? "landmark");
  const [colorId, setColorId] = useState<TripBlockColorId>(initial?.colorId ?? "teal");
  const [error, setError] = useState<string | null>(null);
  const radioName = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the category a name, such as Cafes or Night markets.");
      return;
    }
    onSubmit({ name: trimmed, iconId, colorId });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <CategoryIcon category={{ iconId, colorId }} size="lg" />
        <PopoverTitle className="text-base font-semibold">{initial ? "Edit category" : "New category"}</PopoverTitle>
      </div>

      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor={nameId}>Name</FieldLabel>
        <Input
          id={nameId}
          value={name}
          maxLength={NAME_MAX}
          autoFocus
          placeholder="e.g. Cafes"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      </Field>

      <FieldSet className="gap-2">
        <FieldLegend variant="label">Icon</FieldLegend>
        <div className="grid grid-cols-8 gap-1">
          {GUIDE_ICON_IDS.map((id) => {
            const { label, Icon } = GUIDE_ICONS[id];
            return (
              <label key={id} title={label} className="relative">
                <input type="radio" name={`${radioName}-icon`} value={id} checked={iconId === id} onChange={() => setIconId(id)} className="peer sr-only" />
                <span className="sr-only">{label}</span>
                <span
                  aria-hidden="true"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground peer-checked:bg-secondary peer-checked:text-foreground peer-checked:ring-2 peer-checked:ring-primary/60 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
                >
                  <Icon className="size-4" />
                </span>
              </label>
            );
          })}
        </div>
      </FieldSet>

      <FieldSet className="gap-2">
        <FieldLegend variant="label">Color</FieldLegend>
        <div className="grid grid-cols-6 gap-1.5">
          {CATEGORY_COLOR_IDS.map((id) => {
            const color = getTripBlockColorById(id);
            return (
              <label key={id} title={color.label} className="relative flex justify-center">
                <input type="radio" name={`${radioName}-color`} value={id} checked={colorId === id} onChange={() => setColorId(id)} className="peer sr-only" />
                <span className="sr-only">{color.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-7 cursor-pointer rounded-full ring-offset-2 ring-offset-popover transition-shadow peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring",
                  )}
                  style={{ backgroundColor: color.value }}
                />
              </label>
            );
          })}
        </div>
      </FieldSet>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={useCount > 0}
            title={useCount > 0 ? `Used by ${useCount} ${useCount === 1 ? "list" : "lists"}. Move those lists to another category first.` : undefined}
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            {initial ? "Save" : "Add category"}
          </Button>
        </div>
      </div>
      {onDelete && useCount > 0 ? (
        <p className="-mt-2 text-xs text-muted-foreground">
          Used by {useCount} {useCount === 1 ? "list" : "lists"}, so it can&apos;t be deleted. Move those lists to another category first.
        </p>
      ) : null}
    </form>
  );
}
