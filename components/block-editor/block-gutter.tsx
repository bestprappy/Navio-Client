"use client";

import { useCallback, useEffect, useState, type DragEvent, type ReactNode } from "react";
import { GripVertical, Plus } from "lucide-react";

import { endBlockDrag, findBlockAt, findBlockFromSelection, insertBlockBelow, startBlockDrag } from "./block-commands";
import { hasEditorView, setNoteDragActive, useBlockEditorContext } from "./block-editor-context";
import styles from "./block-editor.module.css";
import { SHORTCUTS, formatShortcut } from "./shortcuts";

type GutterPosition = { pos: number; top: number; left: number; first: boolean };

const LINE_SELECTOR = "p, h4, h5, h6, pre, summary, hr";

/** Vertical centre of a block's first line, in viewport coordinates. */
function firstLineCentre(block: HTMLElement): number {
  const line = block.matches(LINE_SELECTOR) ? block : (block.querySelector<HTMLElement>(LINE_SELECTOR) ?? block);
  const rect = line.getBoundingClientRect();
  if (line.tagName === "HR") return rect.top + rect.height / 2;
  const style = getComputedStyle(line);
  const lineHeight = Number.parseFloat(style.lineHeight) || rect.height;
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  return rect.top + paddingTop + Math.min(lineHeight, rect.height) / 2;
}

/**
 * The margin controls beside the block under the pointer: "+" adds a block
 * below, the grip drags the block or opens its actions. Keyboard users have
 * the same through "/", Ctrl+/ and Ctrl+Shift+arrows.
 */
export function BlockGutter({ restingIcon }: { restingIcon?: ReactNode }) {
  const { viewReady } = useBlockEditorContext("Gutter");
  if (!viewReady) return <RestingIcon icon={restingIcon} hidden={false} />;
  return <MountedGutter restingIcon={restingIcon} />;
}

function RestingIcon({ icon, hidden }: { icon: ReactNode; hidden: boolean }) {
  if (!icon) return null;
  return (
    <span aria-hidden="true" className={styles.restingIcon} data-hidden={String(hidden)}>
      {icon}
    </span>
  );
}

function MountedGutter({ restingIcon }: { restingIcon?: ReactNode }) {
  const { editor, frameRef, blockMenu, openBlockMenu } = useBlockEditorContext("Gutter");
  const [hovered, setHovered] = useState<GutterPosition | null>(null);
  const [pinned, setPinned] = useState<GutterPosition | null>(null);

  const measure = useCallback(
    (pos: number): GutterPosition | null => {
      const frame = frameRef.current;
      if (!frame || !hasEditorView(editor)) return null;
      const node = editor.state.doc.nodeAt(pos);
      const dom = editor.view.nodeDOM(pos);
      if (!frame || !node || !(dom instanceof HTMLElement)) return null;
      const frameRect = frame.getBoundingClientRect();
      // A bullet sits outside its item, so the controls go left of the list's own edge.
      const edgeElement = node.type.name === "listItem" && dom.parentElement ? dom.parentElement : dom;
      return {
        pos,
        top: firstLineCentre(dom) - frameRect.top,
        left: edgeElement.getBoundingClientRect().left - frameRect.left - 4,
        first: pos === 0,
      };
    },
    [editor, frameRef],
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let touched = false;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !editor.isEditable || !hasEditorView(editor)) return;
      if (event.target instanceof Element && event.target.closest("[data-note-gutter]")) return;
      const view = editor.view;
      const box = view.dom.getBoundingClientRect();
      const hit = view.posAtCoords({
        left: Math.min(Math.max(event.clientX, box.left + 2), box.right - 2),
        top: Math.min(Math.max(event.clientY, box.top + 1), box.bottom - 1),
      });
      if (!hit) return;
      const block = findBlockAt(view.state.doc, hit.inside >= 0 ? hit.inside : hit.pos);
      const next = block ? measure(block.pos) : null;
      setHovered((current) =>
        current && next && current.pos === next.pos && current.top === next.top && current.left === next.left ? current : next,
      );
    };
    const handlePointerDown = (event: PointerEvent) => {
      touched = event.pointerType === "touch";
    };
    const handlePointerLeave = () => setHovered(null);
    const hide = () => setHovered(null);
    // On touch there is no hover: the controls follow the caret instead.
    const followCaret = () => {
      if (!touched || !hasEditorView(editor)) return;
      const block = findBlockFromSelection(editor.state);
      setHovered(block ? measure(block.pos) : null);
    };

    frame.addEventListener("pointermove", handlePointerMove);
    frame.addEventListener("pointerdown", handlePointerDown);
    frame.addEventListener("pointerleave", handlePointerLeave);
    // Typing hides the controls until the pointer moves again.
    frame.addEventListener("keydown", hide);
    editor.on("update", hide);
    editor.on("selectionUpdate", followCaret);
    return () => {
      frame.removeEventListener("pointermove", handlePointerMove);
      frame.removeEventListener("pointerdown", handlePointerDown);
      frame.removeEventListener("pointerleave", handlePointerLeave);
      frame.removeEventListener("keydown", hide);
      editor.off("update", hide);
      editor.off("selectionUpdate", followCaret);
    };
  }, [editor, frameRef, measure]);

  // While a block's menu is open its controls stay beside it.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPinned(blockMenu ? measure(blockMenu.pos) : null));
    return () => cancelAnimationFrame(frame);
  }, [blockMenu, measure]);

  const shown = pinned ?? hovered;

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!shown) return;
    startBlockDrag(editor, shown.pos, event.dataTransfer);
    setNoteDragActive(true);
  };

  const handleDragEnd = (event: DragEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    endBlockDrag(editor);
    setNoteDragActive(false);
    setHovered(null);
  };

  return (
    <>
      <RestingIcon icon={restingIcon} hidden={Boolean(shown?.first)} />
      <div
        data-note-gutter=""
        data-visible={String(Boolean(shown))}
        className={styles.gutter}
        style={{ top: shown?.top ?? 0, left: shown?.left ?? 0 }}
      >
        <button
          type="button"
          tabIndex={-1}
          className={styles.gutterButton}
          aria-label="Add a block below"
          title="Add a block below"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const block = shown ? findBlockAt(editor.state.doc, shown.pos) : null;
            if (block) insertBlockBelow(editor, block);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          data-grip=""
          draggable
          className={styles.gutterButton}
          aria-label="Drag to move, or open block actions"
          title={`Drag to move. Click for actions (${formatShortcut(SHORTCUTS.blockMenu)})`}
          aria-haspopup="listbox"
          aria-expanded={Boolean(blockMenu && shown && blockMenu.pos === shown.pos)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={(event) => {
            if (shown) openBlockMenu(shown.pos, event.currentTarget);
          }}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
