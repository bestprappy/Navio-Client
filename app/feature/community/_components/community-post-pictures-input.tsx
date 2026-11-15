"use client";

import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { COMMUNITY_PICTURE_TYPES, useFilePreview } from "./community-picture-input";
import {
  POST_PICTURE_LIMIT,
  movePicture,
  preparePostPictures,
  type PostPicture,
} from "./post-picture-files";

type CommunityPostPicturesInputProps = {
  pictures: readonly PostPicture[];
  disabled?: boolean;
  onChange: (pictures: PostPicture[]) => void;
};

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes("Files");

/**
 * Picks up to ten pictures for a post. The large stage previews the selected
 * picture the way readers will see it; the strip below selects, reorders
 * (drag, or the Earlier/Later buttons) and removes. The first picture is the cover.
 */
export function CommunityPostPicturesInput({ pictures, disabled = false, onChange }: CommunityPostPicturesInputProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [droppingFiles, setDroppingFiles] = useState(false);

  const selectedIndex = Math.max(0, pictures.findIndex((picture) => picture.id === selectedId));
  const selected = pictures[selectedIndex];
  const full = pictures.length >= POST_PICTURE_LIMIT;
  const busy = disabled || preparing;

  async function add(files: readonly File[]) {
    if (files.length === 0 || busy) return;
    setPreparing(true);
    try {
      const prepared = await preparePostPictures(files, pictures);
      setError(prepared.error);
      if (prepared.pictures.length > 0) {
        onChange([...pictures, ...prepared.pictures]);
        setSelectedId(prepared.pictures[0].id);
      }
    } catch (failure) {
      console.error("Could not add post pictures.", {
        component: "CommunityPostPicturesInput",
        error: failure instanceof Error ? failure.message : "Unknown error",
      });
      setError("Those pictures could not be added. Try again.");
    } finally {
      setPreparing(false);
    }
  }

  function remove(index: number) {
    const next = pictures.filter((_, position) => position !== index);
    setError("");
    onChange(next);
    setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? null);
  }

  function move(from: number, to: number) {
    const next = movePicture(pictures, from, to);
    onChange(next);
    setSelectedId(next[to]?.id ?? null);
  }

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event) || busy || full) return;
      event.preventDefault();
      setDroppingFiles(true);
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDroppingFiles(false);
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setDroppingFiles(false);
      void add(Array.from(event.dataTransfer.files));
    },
  };

  const browse = () => input.current?.click();

  return (
    <div className="flex flex-col gap-2" {...dropHandlers}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={`${id}-label`} className="text-sm font-semibold text-foreground">
          Pictures
        </span>
        <span id={`${id}-hint`} className="text-xs text-muted-foreground">
          Up to {POST_PICTURE_LIMIT} PNG or JPEG pictures
        </span>
      </div>

      {selected ? (
        <>
          <PictureStage picture={selected} isCover={selectedIndex === 0} highlighted={droppingFiles} />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="min-w-0 truncate text-xs text-muted-foreground" aria-live="polite">
              <span className="font-medium text-foreground">
                Picture {selectedIndex + 1} of {pictures.length}
              </span>
              <span className="ml-2">{selected.file.name}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move picture earlier"
                title="Move earlier"
                disabled={busy || selectedIndex === 0}
                onClick={() => move(selectedIndex, selectedIndex - 1)}
              >
                <ArrowLeft aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move picture later"
                title="Move later"
                disabled={busy || selectedIndex === pictures.length - 1}
                onClick={() => move(selectedIndex, selectedIndex + 1)}
              >
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => remove(selectedIndex)}>
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
          <PictureStrip
            labelledBy={`${id}-label`}
            pictures={pictures}
            selectedIndex={selectedIndex}
            disabled={busy}
            onSelect={(index) => setSelectedId(pictures[index].id)}
            onMove={move}
          >
            {full ? null : (
              <button
                type="button"
                disabled={busy}
                onClick={browse}
                aria-label={`Add pictures, ${pictures.length} of ${POST_PICTURE_LIMIT} used`}
                aria-describedby={`${id}-hint`}
                className="flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-border bg-well text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {preparing ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                <span className="text-[0.6875rem] font-medium tabular-nums" aria-hidden="true">
                  {pictures.length}/{POST_PICTURE_LIMIT}
                </span>
              </button>
            )}
          </PictureStrip>
        </>
      ) : (
        <button
          type="button"
          disabled={busy}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          onClick={browse}
          className={cn(
            "flex min-h-44 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-well px-3 text-center text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
            droppingFiles && "border-primary bg-primary/10 text-foreground",
            error && "border-destructive",
          )}
        >
          {preparing ? (
            <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-5" aria-hidden="true" />
          )}
          {preparing ? "Preparing pictures" : "Drop pictures or browse"}
        </button>
      )}

      <input
        ref={input}
        type="file"
        multiple
        accept={COMMUNITY_PICTURE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={busy}
        onChange={(event) => {
          void add(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type PictureStageProps = {
  picture: PostPicture;
  isCover: boolean;
  /** Files are being dragged over the input. */
  highlighted: boolean;
};

/** The selected picture, framed exactly like the published gallery. */
function PictureStage({ picture, isCover, highlighted }: PictureStageProps) {
  const url = useFilePreview(picture.file);
  return (
    <div
      className={cn(
        "relative aspect-[4/3] max-h-[26rem] w-full overflow-hidden rounded-xl border border-border/60 bg-well transition-shadow",
        highlighted && "ring-3 ring-primary/60",
      )}
    >
      {url ? (
        <>
          {/* Local blob URLs are not readable by the image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Preview of ${picture.file.name}`} className="relative size-full object-contain" />
        </>
      ) : null}
      {isCover ? (
        <span className="absolute left-3 top-3 rounded-full bg-scrim/70 px-2.5 py-1 text-xs font-semibold text-on-media backdrop-blur-sm">
          Cover
        </span>
      ) : null}
    </div>
  );
}

type PictureStripProps = {
  labelledBy: string;
  pictures: readonly PostPicture[];
  selectedIndex: number;
  disabled: boolean;
  onSelect: (index: number) => void;
  onMove: (from: number, to: number) => void;
  /** The trailing add tile. */
  children?: ReactNode;
};

/** Thumbnails in post order; drag one onto another to reorder. */
function PictureStrip({ labelledBy, pictures, selectedIndex, disabled, onSelect, onMove, children }: PictureStripProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  return (
    <ul aria-labelledby={labelledBy} className="flex gap-2 overflow-x-auto p-1">
      {pictures.map((picture, index) => (
        <li
          key={picture.id}
          draggable={!disabled}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            setDragFrom(index);
          }}
          onDragOver={(event) => {
            if (dragFrom === null) return;
            event.preventDefault();
            setDragOver(index);
          }}
          onDrop={(event) => {
            if (dragFrom === null) return;
            event.preventDefault();
            onMove(dragFrom, index);
            setDragFrom(null);
            setDragOver(null);
          }}
          onDragEnd={() => {
            setDragFrom(null);
            setDragOver(null);
          }}
          className={cn("shrink-0", dragFrom === index && "opacity-40")}
        >
          <PictureThumb
            picture={picture}
            position={index + 1}
            total={pictures.length}
            selected={index === selectedIndex}
            dropTarget={dragOver === index && dragFrom !== index}
            disabled={disabled}
            onSelect={() => onSelect(index)}
          />
        </li>
      ))}
      {children ? <li className="shrink-0">{children}</li> : null}
    </ul>
  );
}

type PictureThumbProps = {
  picture: PostPicture;
  position: number;
  total: number;
  selected: boolean;
  dropTarget: boolean;
  disabled: boolean;
  onSelect: () => void;
};

function PictureThumb({ picture, position, total, selected, dropTarget, disabled, onSelect }: PictureThumbProps) {
  const url = useFilePreview(picture.file);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Picture ${position} of ${total}${position === 1 ? ", cover" : ""}: ${picture.file.name}`}
      className={cn(
        "relative block size-16 overflow-hidden rounded-lg bg-well ring-offset-2 ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60 disabled:cursor-not-allowed",
        selected ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100",
        dropTarget && "ring-2 ring-primary/50",
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" draggable={false} className="size-full object-cover" />
      ) : null}
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-1 min-w-4 rounded bg-scrim/75 px-1 text-[0.625rem] font-semibold leading-4 text-on-media tabular-nums"
      >
        {position === 1 ? "Cover" : position}
      </span>
    </button>
  );
}
