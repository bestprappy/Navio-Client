"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CircleAlert, LoaderCircle, Move } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { INITIAL_CROP, clampCrop, imagePlacement, type AvatarCrop } from "@/lib/avatar-crop";
import { cn } from "@/lib/utils";
import { CropZoomControls } from "./crop-zoom-controls";

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
const THIRDS = ["33.333%", "66.666%"] as const;

const isInitial = (crop: AvatarCrop) =>
  crop.zoom === INITIAL_CROP.zoom && crop.offsetX === INITIAL_CROP.offsetX && crop.offsetY === INITIAL_CROP.offsetY;

/**
 * Lets the traveller frame a photo before it is uploaded. The circle shows how
 * an avatar is cut on the navbar and community posts; the frame shows exactly
 * what a banner keeps. Thirds guides appear while the photo is being moved.
 * Render it keyed by the photo so a newly picked one starts centred and unzoomed.
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
  description = "Drag the photo or use the arrow keys to move it. Fit your face inside the circle.",
  saveLabel = "Save photo",
  savingLabel = "Saving photo…",
  progress = null,
}: AvatarCropperProps) {
  const hintId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; crop: AvatarCrop } | null>(null);
  const [crop, setCrop] = useState<AvatarCrop>(INITIAL_CROP);
  const [moving, setMoving] = useState(false);
  const [touched, setTouched] = useState(false);

  const placement = useMemo(
    () => (source ? imagePlacement(source.bitmap, crop, aspect) : null),
    [source, crop, aspect],
  );

  const update = (next: AvatarCrop) => {
    if (!source) return;
    setTouched(true);
    setCrop(clampCrop(source.bitmap, next, aspect));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (saving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, crop };
    setMoving(true);
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
    setMoving(false);
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
    setMoving(true);
    update({ ...crop, ...move });
  };

  const wide = aspect > 1;

  return (
    <Dialog open={source !== null} onOpenChange={(open) => { if (!open && !saving) onCancel(); }}>
      <DialogContent showCloseButton={!saving} className={cn("gap-5", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id={hintId}>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-[var(--card-radius-md)] bg-well p-2 shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--shadow-color,black)_18%,transparent)]">
          <div
            ref={viewport}
            role="group"
            tabIndex={0}
            aria-label="Photo position"
            aria-describedby={hintId}
            data-moving={moving || undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            onKeyUp={() => setMoving(false)}
            onBlur={endDrag}
            style={{ aspectRatio: String(aspect) }}
            className="group/crop relative mx-auto w-full cursor-grab touch-none overflow-hidden rounded-[var(--card-radius-sm)] bg-muted select-none outline-none focus-visible:ring-3 focus-visible:ring-ring/60 data-moving:cursor-grabbing"
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

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-data-moving/crop:opacity-100 motion-reduce:transition-none"
            >
              {THIRDS.map((at) => (
                <span key={`v${at}`} className="absolute inset-y-0 w-px bg-on-media/45" style={{ left: at }} />
              ))}
              {THIRDS.map((at) => (
                <span key={`h${at}`} className="absolute inset-x-0 h-px bg-on-media/45" style={{ top: at }} />
              ))}
            </div>

            {mask === "circle" ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_100vmax_color-mix(in_oklab,var(--scrim)_55%,transparent)] ring-2 ring-on-media/80"
              />
            ) : (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-on-media/40"
              />
            )}

            {!touched ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-scrim/70 px-3 py-1.5 text-xs font-medium text-on-media backdrop-blur-sm"
              >
                <Move className="size-3.5" />
                Drag to reposition
              </span>
            ) : null}
          </div>
        </div>

        <CropZoomControls
          zoom={crop.zoom}
          step={ZOOM_STEP}
          disabled={saving}
          canReset={!isInitial(crop)}
          onZoomChange={(zoom) => update({ ...crop, zoom })}
          onReset={() => setCrop(INITIAL_CROP)}
        />

        {saving && progress !== null ? (
          <Progress value={progress} className="gap-2">
            <ProgressLabel className="text-xs font-normal text-muted-foreground">{savingLabel}</ProgressLabel>
            <ProgressValue className="text-xs" />
          </Progress>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-[var(--card-radius-sm)] bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
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
