"use client";

import { createContext, useContext, type RefObject } from "react";
import type { Editor } from "@tiptap/core";
import type { ReferenceElement } from "@floating-ui/dom";

import type { NoteEmbed } from "./extensions/embed-node";
import type { SlashMenuStore } from "./extensions/slash-command";

export type BlockMenuRequest = {
  /** Position of the block the menu acts on. */
  pos: number;
  reference: ReferenceElement | null;
};

/** What the selection toolbar lets the keyboard shortcuts do. */
export type ToolbarApi = {
  focus: () => boolean;
  openLink: () => boolean;
};

export type BlockEditorContextValue = {
  editor: Editor;
  /** False until the editor's view is in the page; the menus wait for it. */
  viewReady: boolean;
  frameRef: RefObject<HTMLDivElement | null>;
  slashStore: SlashMenuStore;
  embeds: readonly NoteEmbed[];
  blockMenu: BlockMenuRequest | null;
  openBlockMenu: (pos: number, reference?: ReferenceElement | null) => void;
  /** Closes the block menu; with `refocus`, the caret goes back into the block. */
  closeBlockMenu: (refocus: boolean) => void;
  toolbarApiRef: RefObject<ToolbarApi | null>;
};

export const BlockEditorContext = createContext<BlockEditorContextValue | null>(null);

/** Whether the editor's view exists; tiptap creates it when the content mounts and drops it on unmount. */
export function hasEditorView(editor: Editor): boolean {
  if (editor.isDestroyed) return false;
  try {
    return Boolean(editor.view.dom);
  } catch {
    return false;
  }
}

export function useBlockEditorContext(componentName: string): BlockEditorContextValue {
  const context = useContext(BlockEditorContext);
  if (!context) {
    throw new Error(`BlockEditor.${componentName} must be rendered inside <BlockEditor.Root>.`);
  }
  return context;
}

// Planner cards are dragged with native drag and drop too. While a block is
// being dragged inside a note, its drag events must not reach the card list.
let noteDragActive = false;

export function setNoteDragActive(active: boolean): void {
  noteDragActive = active;
}

export function isNoteDragActive(): boolean {
  return noteDragActive;
}
