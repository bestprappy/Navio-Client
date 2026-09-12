"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ImageFilePicker({ file, onChange, disabled = false, label = "Picture" }: {
  file: File | null; onChange: (file: File | null) => void; disabled?: boolean; label?: string;
}) {
  const id = useId();
  const preview = useRef<HTMLImageElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (preview.current) preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}><ImagePlus aria-hidden="true" className="size-4" />{label}</FieldLabel>
      <Input id={id} type="file" accept="image/png,image/jpeg" disabled={disabled}
        aria-invalid={Boolean(error)} aria-describedby={`${id}-description ${id}-error`}
        onChange={(event) => {
          const selected = event.target.files?.[0] ?? null;
          event.target.value = "";
          if (!selected) return;
          if (!["image/png", "image/jpeg"].includes(selected.type) || selected.size === 0 || selected.size > 5 * 1024 * 1024) {
            setError("Choose a PNG or JPEG picture up to 5 MiB.");
            return;
          }
          setError(""); onChange(selected);
        }} />
      <FieldDescription id={`${id}-description`}>PNG or JPEG, up to 5 MiB, 4096 pixels per side and 12 megapixels.</FieldDescription>
      <FieldError id={`${id}-error`}>{error}</FieldError>
      {file ? <div className="space-y-2 rounded-lg border border-border p-3">
        {/* Local blob preview; no server image optimizer can access this URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={preview} alt={`${label} preview`} className="max-h-64 w-full rounded-md object-contain" />
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 break-all text-sm text-muted-foreground">{file.name}</span>
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { onChange(null); setError(""); }}><X aria-hidden="true" />Remove</Button>
        </div>
      </div> : null}
    </Field>
  );
}
