"use client";

import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectOption } from "./data";

type ProfileSelectFieldProps<TValues extends FieldValues> = {
  name: Path<TValues>;
  label: string;
  placeholder: string;
  options: SelectOption[];
  description?: string;
  disabled?: boolean;
};

/**
 * A labelled select bound to the surrounding form. Shared by every single-choice
 * profile field so the trigger height, focus ring, and error wiring stay
 * identical across the page.
 */
export function ProfileSelectField<TValues extends FieldValues>({
  name,
  label,
  placeholder,
  options,
  description,
  disabled = false,
}: ProfileSelectFieldProps<TValues>) {
  const { control } = useFormContext<TValues>();
  const fieldId = `profile-${name}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = description ? `${fieldId}-description` : undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="min-w-0 gap-2">
          <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
          <Select
            name={field.name}
            value={field.value ?? null}
            disabled={disabled}
            onValueChange={(value) => {
              if (value === null || value === field.value) return;
              field.onChange(value);
            }}
          >
            <SelectTrigger
              ref={field.ref}
              onBlur={field.onBlur}
              id={fieldId}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                [fieldState.error ? errorId : null, descriptionId]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              className="w-full rounded-[var(--btn-radius)] border-border bg-background/30 px-3 data-[size=default]:h-11"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? (
            <p id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          <FieldError id={errorId} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
