"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImageUp, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { isUploadedVehicleImage } from "@/app/feature/planner/planId/_components/garage/vehicle-image-url";
import { uploadCatalogImage } from "./catalog-api";
import { CatalogVehicleThumb } from "./catalog-vehicle-thumb";

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
const MAX_BYTES = 5 * 1024 * 1024;

type CatalogImageFieldProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  disabled?: boolean;
};

/** Checks the file before sending it, so the common mistakes fail instantly. */
function rejectReason(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Choose a PNG or JPEG photo.";
  if (file.size > MAX_BYTES) return "Choose a photo of 5 MB or less.";
  return null;
}

/**
 * The vehicle photo: upload one from this computer (button or drag and drop),
 * or paste an HTTPS link. Either way the result is the vehicle's image URL.
 */
export function CatalogImageField({ value, onChange, error, disabled }: CatalogImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlId = useId();
  const hintId = useId();
  const [progress, setProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const upload = useMutation({
    mutationFn: (file: File) => uploadCatalogImage(file, setProgress),
    retry: false,
    onSuccess: (image) => onChange(image.imageUrl),
    onError: (failure) => console.error("Vehicle photo upload failed.", { component: "CatalogImageField", operation: "uploadCatalogImage", failure }),
  });
  const busy = disabled || upload.isPending;
  const uploaded = Boolean(value && isUploadedVehicleImage(value));
  const message = fileError || (upload.isError ? upload.error.message : "");

  function start(file: File | undefined) {
    if (!file || busy) return;
    const reason = rejectReason(file);
    setFileError(reason ?? "");
    if (reason) return;
    setProgress(0);
    upload.mutate(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    start(event.dataTransfer.files[0]);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">Photo (optional)</span>
      <div
        onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 transition-colors sm:flex-row sm:items-center",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <CatalogVehicleThumb imageUrl={value} className="h-24 w-36" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p id={hintId} className="text-sm text-muted-foreground">
            {upload.isPending ? "Uploading photo…" : uploaded ? "Uploaded photo. Save to apply it to this vehicle." : "Drag a photo here, or choose one from this computer. PNG or JPEG, up to 5 MB."}
          </p>
          {upload.isPending && <Progress value={progress} aria-label="Photo upload progress" />}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} aria-describedby={hintId} onClick={() => inputRef.current?.click()}>
              <ImageUp aria-hidden="true" />{value ? "Replace photo" : "Upload photo"}
            </Button>
            {value && <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { setFileError(""); upload.reset(); onChange(null); }}>
              <Trash2 aria-hidden="true" />Remove
            </Button>}
          </div>
          <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-hidden="true"
            onChange={(event) => { start(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
      </div>
      {message && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><TriangleAlert className="size-4 shrink-0" aria-hidden="true" />{message}</p>}
      <div className="flex flex-col gap-2">
        <label htmlFor={urlId} className="text-xs text-muted-foreground">Or paste an HTTPS image link</label>
        <Input id={urlId} type="text" inputMode="url" maxLength={2048} disabled={busy} placeholder="https://"
          value={uploaded ? "" : value ?? ""} aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value.trim() ? event.target.value : null)} />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
