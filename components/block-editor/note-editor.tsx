"use client";

import { Component, lazy, Suspense, useRef, useState, type ErrorInfo, type ReactNode } from "react";

import styles from "./block-editor.module.css";
import type { InitialFocus } from "./block-editor";
import { NoteContent } from "./note-content";
import type { NoteBlockEditorProps } from "./note-block-editor";

const loadEditor = () => import("./note-block-editor");
const NoteBlockEditor = lazy(loadEditor);

type NoteEditorProps = Omit<NoteBlockEditorProps, "initialFocus">;

/**
 * A note that becomes editable the moment it is pressed or focused.
 *
 * <p>Until then it is the static rendering, so a day with many notes does not
 * start an editor for each, and the editor's code is only fetched once a note
 * is about to be edited. The static rendering matches the editor exactly, and
 * the press is replayed on the editor, so the caret lands where it was put.
 */
export function NoteEditor(props: NoteEditorProps) {
  const [initialFocus, setInitialFocus] = useState<InitialFocus>(null);
  const [active, setActive] = useState(false);

  const preview = (
    <NotePreview
      {...props}
      onPreload={() => void loadEditor()}
      onActivate={(focus) => {
        setInitialFocus(focus);
        setActive(true);
      }}
    />
  );

  if (!active) return preview;
  return (
    <EditorErrorBoundary fallback={<NoteContentFrame value={props.value} placeholder={props.placeholder} restingIcon={props.restingIcon} />}>
      <Suspense fallback={preview}>
        <NoteBlockEditor {...props} initialFocus={initialFocus} />
      </Suspense>
    </EditorErrorBoundary>
  );
}

type NotePreviewProps = NoteEditorProps & {
  onPreload: () => void;
  onActivate: (focus: InitialFocus) => void;
};

function NotePreview({ value, label, placeholder, restingIcon, onPreload, onActivate }: NotePreviewProps) {
  // How the current press started; null when focus arrives from the keyboard.
  const pressRef = useRef<string | null>(null);

  return (
    <div
      role="textbox"
      aria-multiline="true"
      aria-label={label}
      tabIndex={0}
      className={styles.frame}
      onPointerEnter={onPreload}
      onFocus={() => {
        if (!pressRef.current) onActivate("end");
      }}
      onPointerDown={(event) => {
        pressRef.current = event.pointerType;
        // A mouse press opens the editor straight away; a touch waits for the tap, so scrolling past does not.
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        event.preventDefault();
        onActivate({ x: event.clientX, y: event.clientY });
      }}
      onPointerCancel={() => {
        pressRef.current = null;
      }}
      onClick={(event) => {
        const press = pressRef.current;
        pressRef.current = null;
        if (press && press !== "mouse") onActivate({ x: event.clientX, y: event.clientY });
      }}
    >
      <NoteFrameParts value={value} placeholder={placeholder} restingIcon={restingIcon} />
    </div>
  );
}

function NoteFrameParts({ value, placeholder, restingIcon }: Pick<NoteEditorProps, "value" | "placeholder" | "restingIcon">) {
  return (
    <>
      {restingIcon ? (
        <span aria-hidden="true" className={styles.restingIcon}>
          {restingIcon}
        </span>
      ) : null}
      <div>
        <NoteContent content={value} mode="preview" emptyText={placeholder} />
      </div>
    </>
  );
}

function NoteContentFrame(props: Pick<NoteEditorProps, "value" | "placeholder" | "restingIcon">) {
  return (
    <div className={styles.frame}>
      <NoteFrameParts {...props} />
      <p className="mt-2 text-xs text-destructive">The editor could not load. Reload the page to edit this note.</p>
    </div>
  );
}

type BoundaryProps = { fallback: ReactNode; children: ReactNode };

/** Keeps a failed editor chunk or editor crash from taking the itinerary down with it. */
class EditorErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("NoteEditor: the block editor failed to load or render", error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
