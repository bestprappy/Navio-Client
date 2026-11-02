"use client";

import { useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

import { ColorPicker } from "@/components/color-picker/color-picker";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { LabelTextPicker } from "./label-text-picker";
import { newColorSchema, type AdminPaletteColor, type NewColor } from "./palette-api";
import { PaletteThemePreview } from "./palette-theme-preview";

type AddColorFormProps = {
  existing: readonly AdminPaletteColor[];
  disabled: boolean;
  disabledReason?: string;
  isSaving: boolean;
  onAdd: (color: NewColor) => Promise<void>;
};

const HEX = /^#[0-9a-f]{6}$/i;
const DEFAULTS: NewColor = { name: "", hex: "#e8590c", textOnLight: "auto", textOnDark: "auto" };

/** Pick, name and preview a color in both themes, choose its label text, then add it. */
export function AddColorForm({ existing, disabled, disabledReason, isSaving, onAdd }: AddColorFormProps) {
  const form = useForm<NewColor>({ resolver: zodResolver(newColorSchema), defaultValues: DEFAULTS });
  const [hex, name, textOnLight, textOnDark] = useWatch({ control: form.control, name: ["hex", "name", "textOnLight", "textOnDark"] });
  const previewHex = HEX.test(hex ?? "") ? hex.toLowerCase() : null;
  const setHex = useCallback((next: string) => form.setValue("hex", next, { shouldValidate: form.formState.isSubmitted }), [form]);

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
      form.reset({ ...DEFAULTS, hex: values.hex });
    } catch {
      // The workspace shows the request error; keep what the admin picked.
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      noValidate
      aria-labelledby="add-color-heading"
      className="flex flex-col gap-5 rounded-2xl border bg-card p-4 shadow-[0_1px_0_oklch(1_0_0/0.06)_inset,0_8px_24px_-12px_oklch(0_0_0/0.25)] sm:p-5"
    >
      <h2 id="add-color-heading" className="text-base font-semibold">New color</h2>

      <Controller
        name="hex"
        control={form.control}
        render={({ fieldState }) => (
          <Field data-invalid={Boolean(fieldState.error)} className="gap-3">
            <ColorPicker.Root value={hex} onValueChange={setHex} className="flex flex-col gap-3">
              <ColorPicker.Area />
              <div className="flex items-center gap-2">
                <ColorPicker.EyeDropper />
                <ColorPicker.HueSlider className="mx-1.5" />
              </div>
              <ColorPicker.Channels />
            </ColorPicker.Root>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Field data-invalid={Boolean(form.formState.errors.name)}>
        <FieldLabel htmlFor="palette-color-name">Name</FieldLabel>
        <Input id="palette-color-name" maxLength={40} autoComplete="off" placeholder="Sunset orange" aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
        <FieldError errors={[form.formState.errors.name]} />
      </Field>

      <div className="flex flex-col gap-2">
        <h3 id="add-color-label-text" className="text-sm font-medium">Label text</h3>
        <LabelTextPicker
          hex={previewHex}
          labelledBy="add-color-label-text"
          value={{ textOnLight, textOnDark }}
          onValueChange={(next) => {
            form.setValue("textOnLight", next.textOnLight);
            form.setValue("textOnDark", next.textOnDark);
          }}
        />
      </div>

      <PaletteThemePreview hex={previewHex} name={name} textOnLight={textOnLight} textOnDark={textOnDark} />

      <div className="flex flex-col gap-3">
        {disabled && disabledReason ? <p className="text-sm text-muted-foreground">{disabledReason}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={disabled || isSaving}>
          <Plus aria-hidden="true" />
          {isSaving ? "Adding…" : "Add to palette"}
        </Button>
      </div>
    </form>
  );
}
