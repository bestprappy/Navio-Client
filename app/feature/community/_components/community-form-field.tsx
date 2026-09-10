"use client";

import { useId } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CommunityFormField<T extends FieldValues>({
  control,
  name,
  label,
  multiline = false,
  disabled = false,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const props = {
          ...field,
          value: String(field.value ?? ""),
          id,
          disabled,
          "aria-invalid": fieldState.invalid,
          "aria-describedby": fieldState.error ? `${id}-error` : undefined,
        };
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {multiline ? (
              <Textarea {...props} rows={3} />
            ) : (
              <Input {...props} />
            )}
            <FieldError id={`${id}-error`} errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
