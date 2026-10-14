"use client";

import { Component, lazy, Suspense, useCallback, useLayoutEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { NotebookPen } from "lucide-react";
import { useSetAtom } from "jotai";

import { cn } from "@/lib/utils";

import { updatePlaceItemAtom } from "../../overview/trip-builder.atoms";

// Like trip notes, the editor and markdown parser load only once a stop's notes are on screen.
const NoteEditor = lazy(() =>
  import("@/components/block-editor/note-editor").then((module) => ({ default: module.NoteEditor })),
);
const NoteContent = lazy(() =>
  import("@/components/block-editor/note-content").then((module) => ({ default: module.NoteContent })),
);

const NOTES_ICON = <NotebookPen className="size-4" />;

function PlainNotes({ value, placeholder }: { value: string; placeholder?: string }) {
  return (
    <p className="min-w-0 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground">
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </p>
  );
}

type BoundaryProps = { fallback: ReactNode; children: ReactNode };

/** A notes chunk that fails to load leaves the plain text, not a broken itinerary. */
class NotesErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("PlaceNotes: the notes renderer failed to load", error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type PlaceNotesEditorProps = {
  blockId: string;
  itemId: string;
  itemName: string;
  value: string;
  placeholder: string;
};

/** A stop's notes, written with the same blocks as trip notes: type / for headings, lists and to-dos. */
export function PlaceNotesEditor({ blockId, itemId, itemName, value, placeholder }: PlaceNotesEditorProps) {
  const updatePlaceItem = useSetAtom(updatePlaceItemAtom);
  const handleChange = useCallback(
    (notes: string) => updatePlaceItem({ blockId, itemId, updates: { notes } }),
    [blockId, itemId, updatePlaceItem],
  );

  return (
    // The card selects its place on click; editing should not re-trigger that.
    <div className="-ml-2 min-w-0" onClick={(event) => event.stopPropagation()}>
      <NotesErrorBoundary fallback={<PlainNotes value={value} placeholder={placeholder} />}>
        <Suspense fallback={<div className="pl-11"><PlainNotes value={value} placeholder={placeholder} /></div>}>
          <NoteEditor
            value={value}
            onChange={handleChange}
            label={`Notes for ${itemName}`}
            placeholder={placeholder}
            restingIcon={NOTES_ICON}
          />
        </Suspense>
      </NotesErrorBoundary>
    </div>
  );
}

/**
 * The notes on a closed card, formatted and faded out after a few lines. Links and toggles
 * work only where the card cannot be opened for editing; otherwise a press opens the card.
 */
export function PlaceNotesPreview({ value, interactive, clamped = true }: { value: string; interactive: boolean; clamped?: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || !clamped || typeof ResizeObserver === "undefined") return;
    const measure = () => setOverflowing(frame.scrollHeight > frame.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    if (frame.firstElementChild) observer.observe(frame.firstElementChild);
    return () => observer.disconnect();
  }, [value, clamped]);

  if (!value.trim()) return null;
  return (
    <div
      ref={frameRef}
      className={cn(
        "min-w-0",
        clamped && "max-h-24 overflow-hidden",
        clamped && overflowing && "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]",
      )}
    >
      <NotesErrorBoundary fallback={<PlainNotes value={value} />}>
        <Suspense fallback={<PlainNotes value={value} />}>
          <NoteContent content={value} mode={interactive ? "readonly" : "preview"} />
        </Suspense>
      </NotesErrorBoundary>
    </div>
  );
}
