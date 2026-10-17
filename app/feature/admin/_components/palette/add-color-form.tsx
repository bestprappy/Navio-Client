"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DARK_SURFACE, LIGHT_SURFACE, readableForeground } from "@/lib/palette/palette-colors";

import { newColorSchema, type AdminPaletteColor, type NewColor } from "./palette-api";

type AddColorFormProps = {
  existing: readonly AdminPaletteColor[];
  disabled: boolean;
  disabledReason?: string;
  isSaving: boolean;
  onAdd: (color: NewColor) => Promise<void>;
};

const HEX = /^#[0-9a-f]{6}$/i;

/** Name, pick and preview a color in both themes before adding it to the palette. */
export function AddColorForm({ existing, disabled, disabledReason, isSaving, onAdd }: AddColorFormProps) {
  const form = useForm<NewColor>({ resolver: zodResolver(newColorSchema), defaultValues: { name: "", hex: "#e8590c" } });
  const hex = useWatch({ control: form.control, name: "hex" });
  const name = useWatch({ control: form.control, name: "name" });
  const previewHex = HEX.test(hex ?? "") ? hex.toLowerCase() : null;

  async function submit(values: NewColor) {
    const hexValue = values.hex.trim().toLowerCase();
    const nameValue = values.name.trim().toLowerCase();
    const sameHex = existing.find((color) => color.hex === hexValue);
    if (sameHex) {
      form.setError("hex", { message: sameHex.retired ? `${sameHex.name} already uses this color. Restore it instead.` : `${sameHex.name} already uses this color.` });
      return;
    }
    if (existing.some((color) => color.name.trim().toLowerCase() === nameValue)) {
      form.setError("name", { message: "Another color already uses this name." });
      return;
    }
    try {
      await onAdd(values);
      form.reset({ name: "", hex: values.hex });
    } catch {
      // The workspace shows the request error; keep what the admin typed.
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-xs" aria-labelledby="add-color-heading">
      <div className="flex flex-col gap-1">
        <h2 id="add-color-heading" className="text-lg font-semibold">Add a color</h2>
        <p className="text-sm text-muted-foreground">Added colors appear in every planner and guide color picker.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Field data-invalid={Boolean(form.formState.errors.name)} className="sm:flex-1">
          <FieldLabel htmlFor="palette-color-name">Name</FieldLabel>
          <Input id="palette-color-name" maxLength={40} autoComplete="off" placeholder="Sunset orange" aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>

        <Controller
          name="hex"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={Boolean(fieldState.error)} className="sm:w-56">
              <FieldLabel htmlFor="palette-color-hex">Color</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick a color"
                  value={previewHex ?? "#000000"}
                  onChange={(event) => field.onChange(event.target.value)}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
                <Input
                  id="palette-color-hex"
                  className="font-mono uppercase"
                  maxLength={7}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(fieldState.error)}
                  aria-describedby="palette-color-hex-help"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                />
              </div>
              <FieldDescription id="palette-color-hex-help">Hex code, such as #E8590C.</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Preview</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ThemePreview label="Light theme" surface={LIGHT_SURFACE} text="#14161c" hex={previewHex} name={name} />
          <ThemePreview label="Dark theme" surface={DARK_SURFACE} text="#f5f6f8" hex={previewHex} name={name} />
        </div>
      </div>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {disabled && disabledReason ? <p className="text-sm text-muted-foreground sm:mr-auto">{disabledReason}</p> : null}
        <Button type="submit" disabled={disabled || isSaving}>
          <Plus aria-hidden="true" />
          {isSaving ? "Adding…" : "Add color"}
        </Button>
      </div>
    </form>
  );
}

function ThemePreview({ label, surface, text, hex, name }: { label: string; surface: string; text: string; hex: string | null; name: string }) {
  return (
    <figure className="flex flex-col gap-2 rounded-lg border p-3" style={{ backgroundColor: surface, color: text }}>
      <figcaption className="text-xs opacity-70">{label}</figcaption>
      {hex ? (
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: hex, color: readableForeground(hex) }}>1</span>
          <span className="h-1 flex-1 rounded-full" style={{ backgroundColor: hex }} />
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: hex, color: readableForeground(hex) }}>{name.trim() || "Day 1"}</span>
        </div>
      ) : (
        <p className="text-xs opacity-70">Enter a hex code to preview it.</p>
      )}
    </figure>
  );
}
