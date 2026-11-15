"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CommunityFlairBadge } from "../../_components/community-flair-badge";
import { TripColorSwatches } from "../../../planner/planId/_components/block/trip-color-swatches";
import { useTripBlockColorResolver } from "../../../planner/planId/_components/constants/use-trip-block-color";

type FlairFieldValues = FieldValues & {
  items: { label: string; colorId: string }[];
};

type FlairFieldProps<T extends FlairFieldValues> = {
  control: Control<T>;
  index: number;
};

/**
 * The flair exactly as members will see it, updating while the moderator types
 * and picks a color. Used as the item's fieldset legend so the group is named
 * after the flair.
 */
export function CommunityFlairPreview<T extends FlairFieldValues>({
  control,
  index,
}: FlairFieldProps<T>) {
  const label = useWatch({ control, name: `items.${index}.label` as Path<T> });
  const colorId = useWatch({
    control,
    name: `items.${index}.colorId` as Path<T>,
  });
  const text = typeof label === "string" ? label.trim() : "";
  return (
    <legend className="min-w-0 max-w-full">
      <span className="sr-only">Flair {index + 1}: </span>
      <CommunityFlairBadge
        flair={{
          label: text || "New flair",
          colorId: typeof colorId === "string" ? colorId : "",
        }}
        className="h-auto px-3 py-1 text-sm"
      />
    </legend>
  );
}

/**
 * One swatch button that opens the palette, so a long flair list stays compact.
 * Text color on each swatch follows the palette's white, black or automatic setting.
 */
export function CommunityFlairColorField<T extends FlairFieldValues>({
  control,
  index,
}: FlairFieldProps<T>) {
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const resolveColor = useTripBlockColorResolver();
  return (
    <Controller
      control={control}
      name={`items.${index}.colorId` as Path<T>}
      render={({ field }) => {
        const colorId = typeof field.value === "string" ? field.value : "";
        const color = resolveColor(colorId);
        return (
          <Field className="w-auto shrink-0">
            <FieldLabel htmlFor={triggerId}>Color</FieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id={triggerId}
                    type="button"
                    variant="outline"
                    aria-label={`Color, ${color.label}`}
                    className="justify-start gap-2"
                  />
                }
              >
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full shadow-xs"
                  style={{ backgroundColor: color.value }}
                />
                <span className="min-w-14 text-left">{color.label}</span>
                <ChevronDown aria-hidden="true" className="text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-auto gap-3 p-4">
                <PopoverHeader>
                  <PopoverTitle>Flair color</PopoverTitle>
                </PopoverHeader>
                <TripColorSwatches
                  selectedId={colorId || null}
                  onSelect={(next) => {
                    field.onChange(next);
                    setOpen(false);
                  }}
                  getLabel={(option) => option.label}
                />
              </PopoverContent>
            </Popover>
          </Field>
        );
      }}
    />
  );
}
