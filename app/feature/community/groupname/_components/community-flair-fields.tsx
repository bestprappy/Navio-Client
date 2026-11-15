"use client";

import { useId } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { ColorPicker } from "@/components/color-picker/color-picker";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldTitle } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { CommunityFlairBadge } from "../../_components/community-flair-badge";
import {
  DEFAULT_FLAIR_COLOR,
  FLAIR_HEX_PATTERN,
  FLAIR_TEXT_COLORS,
  flairTextHex,
  isFlairTextHardToRead,
  type FlairTextColor,
} from "../../_components/flair-colors";

type FlairFieldValues = FieldValues & {
  items: { label: string; color: string; textColor: FlairTextColor }[];
};

type FlairFieldProps<T extends FlairFieldValues> = {
  control: Control<T>;
  index: number;
};

function asHex(value: unknown): string {
  return typeof value === "string" && FLAIR_HEX_PATTERN.test(value)
    ? value
    : DEFAULT_FLAIR_COLOR;
}

function asTextColor(value: unknown): FlairTextColor {
  return value === "black" ? "black" : "white";
}

function useFlairAppearance<T extends FlairFieldValues>(
  control: Control<T>,
  index: number,
) {
  const color = useWatch({ control, name: `items.${index}.color` as Path<T> });
  const textColor = useWatch({
    control,
    name: `items.${index}.textColor` as Path<T>,
  });
  return { color: asHex(color), textColor: asTextColor(textColor) };
}

/**
 * The flair exactly as members will see it, updating while the moderator
 * types and picks colors. Used as the item's fieldset legend so the group is
 * named after the flair.
 */
export function CommunityFlairPreview<T extends FlairFieldValues>({
  control,
  index,
}: FlairFieldProps<T>) {
  const label = useWatch({ control, name: `items.${index}.label` as Path<T> });
  const appearance = useFlairAppearance(control, index);
  const text = typeof label === "string" ? label.trim() : "";
  return (
    <legend className="min-w-0 max-w-full">
      <span className="sr-only">Flair {index + 1}: </span>
      <CommunityFlairBadge
        flair={{ label: text || "New flair", ...appearance }}
        className="h-auto px-3 py-1 text-sm"
      />
    </legend>
  );
}

/** A swatch button that opens the color wheel, so any color can be chosen. */
export function CommunityFlairColorField<T extends FlairFieldValues>({
  control,
  index,
}: FlairFieldProps<T>) {
  const triggerId = useId();
  return (
    <Controller
      control={control}
      name={`items.${index}.color` as Path<T>}
      render={({ field }) => {
        const hex = asHex(field.value);
        return (
          <Field className="w-auto shrink-0">
            <FieldLabel htmlFor={triggerId}>Color</FieldLabel>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    id={triggerId}
                    type="button"
                    variant="outline"
                    aria-label={`Color, ${hex.toUpperCase()}`}
                    className="justify-start gap-2"
                  />
                }
              >
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_oklch(0_0_0/0.15)]"
                  style={{ backgroundColor: hex }}
                />
                <span className="w-16 text-left tabular-nums">
                  {hex.toUpperCase()}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="text-muted-foreground"
                />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-72 gap-3 p-4"
              >
                <PopoverHeader>
                  <PopoverTitle>Flair color</PopoverTitle>
                </PopoverHeader>
                <ColorPicker.Root
                  value={hex}
                  onValueChange={field.onChange}
                  className="flex flex-col gap-3"
                >
                  <ColorPicker.Area />
                  <div className="flex items-center gap-2">
                    <ColorPicker.EyeDropper />
                    <ColorPicker.HueSlider className="mx-1.5" />
                  </div>
                  <ColorPicker.Channels />
                </ColorPicker.Root>
              </PopoverContent>
            </Popover>
          </Field>
        );
      }}
    />
  );
}

/** White or black text, each option drawn on the flair's own color. */
export function CommunityFlairTextField<T extends FlairFieldValues>({
  control,
  index,
}: FlairFieldProps<T>) {
  const labelId = useId();
  const { color } = useFlairAppearance(control, index);
  return (
    <Controller
      control={control}
      name={`items.${index}.textColor` as Path<T>}
      render={({ field }) => (
        <Field className="w-auto shrink-0">
          <FieldTitle id={labelId}>Text</FieldTitle>
          <RadioGroup
            aria-labelledby={labelId}
            value={asTextColor(field.value)}
            onValueChange={(value) => field.onChange(asTextColor(value))}
            className="flex h-9 items-center gap-1"
          >
            {FLAIR_TEXT_COLORS.map((choice) => (
              <label
                key={choice}
                className={cn(
                  "flex h-full cursor-pointer items-center gap-2 rounded-full px-2 transition-colors hover:bg-muted",
                  "has-data-checked:bg-muted has-focus-visible:ring-2 has-focus-visible:ring-ring/50",
                )}
              >
                <RadioGroupItem value={choice} />
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                  style={{ backgroundColor: color, color: flairTextHex(choice) }}
                >
                  {choice}
                </span>
              </label>
            ))}
          </RadioGroup>
        </Field>
      )}
    />
  );
}

/** Names the problem and the fix when the chosen text is hard to read. */
export function CommunityFlairContrastNote<T extends FlairFieldValues>({
  control,
  index,
}: FlairFieldProps<T>) {
  const { color, textColor } = useFlairAppearance(control, index);
  if (!isFlairTextHardToRead(color, textColor)) return null;
  const other = textColor === "white" ? "black" : "white";
  const otherReadable = !isFlairTextHardToRead(color, other);
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-warning"
      />
      <span>
        {textColor === "white" ? "White" : "Black"} text is hard to read on
        this color.{" "}
        {otherReadable
          ? `Choose ${other} text instead.`
          : "Pick a lighter or darker color."}
      </span>
    </p>
  );
}
