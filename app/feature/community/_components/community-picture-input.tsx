"use client";

import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const COMMUNITY_PICTURE_TYPES = ["image/png", "image/jpeg"];
export const COMMUNITY_PICTURE_MAX_BYTES = 5 * 1024 * 1024;

/** Mirrors the service's PictureValidator so most rejections happen before upload. */
export function validateCommunityPicture(file: File): string {
  if (!COMMUNITY_PICTURE_TYPES.includes(file.type) || file.size === 0) {
    return "Choose a PNG or JPEG picture.";
  }
  if (file.size > COMMUNITY_PICTURE_MAX_BYTES) {
    return "Pictures must be 5 MB or smaller.";
  }
  return "";
}

/**
 * Object URL for a local file, revoked once the file changes or the component
 * unmounts. Revocation is deferred a tick so StrictMode's simulated remount,
 * which reuses the same URL, can cancel it.
 */
export function useFilePreview(file: File | null): string {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const pending = useRef<{ url: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  useEffect(() => {
    if (pending.current?.url === url) {
      clearTimeout(pending.current.timer);
      pending.current = null;
    }
    if (!url) return;
    return () => {
      pending.current = { url, timer: setTimeout(() => URL.revokeObjectURL(url), 0) };
    };
  }, [url]);
  return url;
}

type CommunityPictureInputProps = {
  label: string;
  hint: string;
  shape: "banner" | "icon" | "post";
  /** The chosen local file, when it has not been uploaded yet. */
  file: File | null;
  /** The picture already saved on the server, shown until replaced. */
  currentUrl?: string;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  /** Offered only when a saved picture exists. */
  onRemoveCurrent?: () => void;
};

/**
 * Drop zone and file picker with a preview in the picture's real shape.
 * The whole zone is one keyboard-reachable button; dropping a file also works.
 */
export function CommunityPictureInput({
  label,
  hint,
  shape,
  file,
  currentUrl,
  disabled = false,
  onFileChange,
  onRemoveCurrent,
}: CommunityPictureInputProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const preview = useFilePreview(file);
  const shown = preview || currentUrl || "";

  function choose(selected: File | null | undefined) {
    if (!selected) return;
    const message = validateCommunityPicture(selected);
    setError(message);
    if (!message) onFileChange(selected);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) choose(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span id={`${id}-label`} className="text-sm font-semibold text-foreground">
          {label}
        </span>
        <span id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </span>
      </div>
      <div className={cn("flex gap-3", shape === "icon" ? "items-center" : "flex-col")}>
        <button
          type="button"
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "group relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-border bg-well text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
            shape === "icon" && "size-24 rounded-full",
            shape === "banner" && "aspect-[4/1] w-full rounded-xl",
            shape === "post" && "min-h-44 w-full rounded-xl",
            shown && "border-solid border-transparent",
            dragging && "border-primary bg-primary/10",
            error && "border-destructive",
          )}
        >
          {shown ? (
            // Local blob or authenticated proxy URL; neither is readable by the image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt=""
              className={cn(
                "absolute inset-0 size-full",
                shape === "post" ? "object-contain" : "object-cover",
              )}
            />
          ) : null}
          <span
            className={cn(
              "relative flex flex-col items-center gap-1.5 px-3 text-center text-xs font-medium",
              shown &&
                "rounded-full bg-scrim/70 px-3 py-1.5 text-on-media opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            {shown ? (
              <Upload className="size-4" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-5" aria-hidden="true" />
            )}
            {shown ? "Replace" : shape === "icon" ? "Add icon" : "Drop a picture or browse"}
          </span>
        </button>
        <input
          ref={input}
          id={id}
          type="file"
          accept={COMMUNITY_PICTURE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {file || (currentUrl && onRemoveCurrent) ? (
          <div className="flex flex-wrap items-center gap-2">
            {file ? (
              <span className="min-w-0 max-w-56 truncate text-xs text-muted-foreground">
                {file.name}
              </span>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                setError("");
                if (file) onFileChange(null);
                else onRemoveCurrent?.();
              }}
            >
              <Trash2 aria-hidden="true" />
              {file ? "Clear" : "Remove"}
            </Button>
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
