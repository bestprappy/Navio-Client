"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  INITIAL_CROP,
  MAX_ZOOM,
  MIN_ZOOM,
  clampCrop,
  imagePlacement,
  type AvatarCrop,
} from "@/lib/avatar-crop";

type AvatarCropperProps = {
  /** The decoded photo, or null when the dialog is closed. */
  source: { bitmap: ImageBitmap; url: string } | null;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (crop: AvatarCrop) => void;
  /** Viewport width / height. 1 frames a photo; banners use 3. */
  aspect?: number;
  /** "circle" previews the round avatar cut; "frame" shows the full rectangle. */
  mask?: "circle" | "frame";
  title?: string;
  description?: string;
  saveLabel?: string;
  savingLabel?: string;
  /** Upload progress 0-100 while saving, when the transport reports it. */
  progress?: number | null;
};

const KEY_STEP = 0.02;
const KEY_STEP_LARGE = 0.1;
const ZOOM_STEP = 0.1;

/**
 * Lets the traveller frame a square photo before it is uploaded. The circle
 * shows how the photo is cut on the navbar and community posts; the square
 * corners still appear on the profile card. Render it keyed by the photo so a
 * newly picked one starts centred and unzoomed.
 */
export function AvatarCropper({
  source,
  saving,
  error,
  onCancel,
  onSave,
  aspect = 1,
  mask = "circle",
  title = "Frame your photo",
  description = "Drag the photo or use the arrow keys to move it. Zoom to fit your face inside the circle.",
  saveLabel = "Save photo",
  savingLabel = "Saving photo…",
  progress = null,
}: AvatarCropperProps) {
  const zoomId = useId();
  const hintId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; crop: AvatarCrop } | null>(null);
  const [crop, setCrop] = useState<AvatarCrop>(INITIAL_CROP);

  const placement = useMemo(
    () => (source ? imagePlacement(source.bitmap, crop, aspect) : null),
    [source, crop, aspect],
  );

  const update = (next: AvatarCrop) => {
    if (source) setCrop(clampCrop(source.bitmap, next, aspect));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (saving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, crop };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    const edge = viewport.current?.getBoundingClientRect().width;
    if (!start || !edge) return;
    update({
      ...start.crop,
      offsetX: start.crop.offsetX + (event.clientX - start.x) / edge,
      offsetY: start.crop.offsetY + (event.clientY - start.y) / edge,
    });
  };
  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const moves: Record<string, Partial<AvatarCrop>> = {
      ArrowLeft: { offsetX: crop.offsetX - step },
      ArrowRight: { offsetX: crop.offsetX + step },
      ArrowUp: { offsetY: crop.offsetY - step },
      ArrowDown: { offsetY: crop.offsetY + step },
      "+": { zoom: crop.zoom + ZOOM_STEP },
      "=": { zoom: crop.zoom + ZOOM_STEP },
      "-": { zoom: crop.zoom - ZOOM_STEP },
    };
    const move = moves[event.key];
    if (!move || saving) return;
    event.preventDefault();
    update({ ...crop, ...move });
  };

  return (
    <Dialog open={source !== null} onOpenChange={(open) => { if (!open && !saving) onCancel(); }}>
      <DialogContent showCloseButton={!saving} className={aspect > 1 ? "gap-5 sm:max-w-2xl" : "gap-5 sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id={hintId}>{description}</DialogDescription>
        </DialogHeader>

        <div
          ref={viewport}
          role="group"
          tabIndex={0}
          aria-label="Photo position"
          aria-describedby={hintId}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          style={{ aspectRatio: String(aspect) }}
          className="relative mx-auto w-full max-w-[min(100%,40rem)] cursor-grab touch-none overflow-hidden rounded-[var(--card-radius-md)] bg-muted select-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        >
          {source && placement ? (
            // A local blob URL; the Next image optimiser cannot fetch it.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={source.url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                left: `${placement.left * 100}%`,
                top: `${placement.top * 100}%`,
                width: `${placement.width * 100}%`,
                height: `${placement.height * 100}%`,
              }}
            />
          ) : null}
          {mask === "circle" ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_100vmax_color-mix(in_oklab,var(--scrim)_55%,transparent)] ring-2 ring-on-media/80"
            />
          ) : (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-on-media/70" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor={zoomId} className="text-sm font-medium text-foreground">
            Zoom
          </label>
          <input
            id={zoomId}
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={crop.zoom}
            disabled={saving}
            onChange={(event) => update({ ...crop, zoom: Number(event.target.value) })}
            className="h-11 flex-1 cursor-pointer accent-primary disabled:cursor-not-allowed"
          />
        </div>

        {saving && progress !== null ? (
          <div className="flex items-center gap-3" role="status" aria-live="polite">
            <progress max={100} value={progress} className="h-1.5 flex-1 accent-primary" aria-label="Upload progress" />
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{progress}%</span>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" size="lg" className="px-5" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="lg" className="px-5" disabled={saving} onClick={() => onSave(crop)}>
            {saving ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
            {saving ? savingLabel : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
