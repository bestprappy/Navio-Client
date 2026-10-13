"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
  type ReactNode,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import type { ReferenceElement } from "@floating-ui/dom";

import { cn } from "@/lib/utils";

import { BlockActionsMenu } from "./block-actions-menu";
import { findBlockAt, focusBlock, selectBlock } from "./block-commands";
import {
  BlockEditorContext,
  hasEditorView,
  isNoteDragActive,
  useBlockEditorContext,
  setNoteDragActive,
  type BlockEditorContextValue,
  type BlockMenuRequest,
  type ToolbarApi,
} from "./block-editor-context";
import styles from "./block-editor.module.css";
import { BlockGutter } from "./block-gutter";
import { BubbleToolbar } from "./bubble-toolbar";
import { createNoteExtensions } from "./extensions";
import { createBlockEditorController } from "./extensions/block-keymap";
import type { NoteEmbed } from "./extensions/embed-node";
import { createSlashMenuStore } from "./extensions/slash-command";
import { parseNoteMarkdown, serializeNoteMarkdown } from "./note-markdown";
import { SHORTCUTS, formatShortcut } from "./shortcuts";
import { SlashMenu } from "./slash-menu";

/**
 * A Notion-style block editor over a markdown string.
 *
 * <pre>
 * <BlockEditor.Root value={markdown} onChange={setMarkdown} label="Trip note" placeholder="Write a note">
 *   <BlockEditor.Gutter restingIcon={<FileText />} />
 *   <BlockEditor.Content />
 *   <BlockEditor.SlashMenu />
 *   <BlockEditor.BubbleToolbar />
 *   <BlockEditor.BlockMenu />
 * </BlockEditor.Root>
 * </pre>
 */

/** Where the caret goes when the editor opens: a point that was clicked, or the end. */
export type InitialFocus = { x: number; y: number } | "end" | null;

type RootProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Shown while the note is empty. */
  placeholder: string;
  initialFocus?: InitialFocus;
  /** Host blocks the slash menu can insert. Read once; keep the array stable. */
  embeds?: readonly NoteEmbed[];
  /** "reading" sets long-form text at the body size; notes stay compact. */
  size?: "compact" | "reading";
  /** Hands the editor to a host that changes the document from outside, such as a map adding a block. */
  onEditorReady?: (editor: Editor | null) => void;
  className?: string;
  children: ReactNode;
};

const NO_EMBEDS: readonly NoteEmbed[] = [];

function useViewReady(editor: Editor): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      editor.on("mount", onChange);
      editor.on("unmount", onChange);
      return () => {
        editor.off("mount", onChange);
        editor.off("unmount", onChange);
      };
    },
    [editor],
  );
  return useSyncExternalStore(subscribe, () => hasEditorView(editor), () => false);
}

function placeInitialFocus(editor: Editor, focus: Exclude<InitialFocus, null>) {
  if (focus === "end") {
    editor.commands.focus("end");
    return;
  }
  // The static note was swapped for the editor under the pointer: repeat the click on what is there now.
  const element = document.elementFromPoint(focus.x, focus.y);
  const control = element instanceof HTMLElement ? element.closest<HTMLElement>("input, button") : null;
  if (control && editor.view.dom.contains(control)) {
    control.click();
    editor.view.focus();
    return;
  }
  const hit = editor.view.posAtCoords({ left: focus.x, top: focus.y });
  if (hit) editor.chain().focus().setTextSelection(hit.pos).run();
  else editor.commands.focus("end");
}

function Root({
  value,
  onChange,
  label,
  placeholder,
  initialFocus = null,
  embeds: embedsProp = NO_EMBEDS,
  size = "compact",
  onEditorReady,
  className,
  children,
}: RootProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const toolbarApiRef = useRef<ToolbarApi | null>(null);
  const onChangeRef = useRef(onChange);
  const lastValueRef = useRef(value);
  const descriptionId = useId();
  const [embeds] = useState(embedsProp);
  const [slashStore] = useState(createSlashMenuStore);
  const [{ controller, setHandlers }] = useState(createBlockEditorController);
  const [extensions] = useState(() => createNoteExtensions({ placeholder, slashStore, controller, embeds }));
  const [initialContent] = useState(() => parseNoteMarkdown(value, embeds));
  const [initialFocusOnMount] = useState(initialFocus);
  const [blockMenu, setBlockMenu] = useState<BlockMenuRequest | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions,
    content: initialContent,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: cn(styles.content, styles.editable),
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        "aria-describedby": descriptionId,
      },
    },
    onUpdate: ({ editor: current }) => {
      const next = serializeNoteMarkdown(current.getJSON(), embeds);
      if (next === lastValueRef.current) return;
      lastValueRef.current = next;
      onChangeRef.current(next);
    },
  });

  const viewReady = useViewReady(editor);

  useEffect(() => {
    if (!onEditorReady || !viewReady) return;
    onEditorReady(editor);
    return () => onEditorReady(null);
  }, [editor, onEditorReady, viewReady]);

  // A change made elsewhere (another tab saving, an undo in the planner) replaces the content.
  useEffect(() => {
    if (!viewReady || value === lastValueRef.current) return;
    lastValueRef.current = value;
    editor.commands.setContent(parseNoteMarkdown(value, embeds), { emitUpdate: false });
  }, [editor, embeds, value, viewReady]);

  useEffect(() => {
    if (!initialFocusOnMount || !viewReady) return;
    // After the toggles and to-dos have rendered their open and checked state.
    const timer = window.setTimeout(() => placeInitialFocus(editor, initialFocusOnMount), 0);
    return () => window.clearTimeout(timer);
  }, [editor, initialFocusOnMount, viewReady]);

  const openBlockMenu = useCallback(
    (pos: number, reference?: ReferenceElement | null) => {
      const target = findBlockAt(editor.state.doc, pos);
      if (!target) return;
      const dom = editor.view.nodeDOM(target.pos);
      selectBlock(editor, target);
      setBlockMenu({ pos: target.pos, reference: reference ?? (dom instanceof Element ? dom : null) });
    },
    [editor],
  );

  const blockMenuRef = useRef(blockMenu);
  useEffect(() => {
    blockMenuRef.current = blockMenu;
  }, [blockMenu]);

  const closeBlockMenu = useCallback(
    (refocus: boolean) => {
      const current = blockMenuRef.current;
      blockMenuRef.current = null;
      setBlockMenu(null);
      const target = current && refocus ? findBlockAt(editor.state.doc, current.pos) : null;
      if (target) focusBlock(editor, target);
    },
    [editor],
  );

  useEffect(() => {
    setHandlers({
      openBlockMenu: (pos) => openBlockMenu(pos),
      openLinkEditor: () => toolbarApiRef.current?.openLink() ?? false,
      focusToolbar: () => toolbarApiRef.current?.focus() ?? false,
    });
  }, [setHandlers, openBlockMenu]);

  const context = useMemo<BlockEditorContextValue>(
    () => ({ editor, viewReady, frameRef, slashStore, embeds, blockMenu, openBlockMenu, closeBlockMenu, toolbarApiRef }),
    [editor, viewReady, slashStore, embeds, blockMenu, openBlockMenu, closeBlockMenu],
  );

  // A block dragged inside a note must not also be dropped onto the planner's card list.
  const containNoteDrag = (event: DragEvent<HTMLDivElement>) => {
    if (isNoteDragActive()) event.stopPropagation();
  };

  return (
    <BlockEditorContext.Provider value={context}>
      <div
        ref={frameRef}
        data-no-drag=""
        data-size={size}
        className={cn(styles.frame, className)}
        onDragStart={(event) => {
          setNoteDragActive(true);
          event.stopPropagation();
        }}
        onDragEnd={(event) => {
          setNoteDragActive(false);
          event.stopPropagation();
        }}
        onDragEnter={containNoteDrag}
        onDragOver={containNoteDrag}
        onDragLeave={containNoteDrag}
        onDrop={(event) => {
          containNoteDrag(event);
          setNoteDragActive(false);
        }}
      >
        {children}
        <p id={descriptionId} className="sr-only">
          Type slash to add a block. {formatShortcut(SHORTCUTS.blockMenu)} opens actions for the current block,{" "}
          {formatShortcut(SHORTCUTS.moveUp)} and {formatShortcut(SHORTCUTS.moveDown)} move it, and{" "}
          {formatShortcut(SHORTCUTS.toolbar)} reaches the formatting toolbar when text is selected.
        </p>
      </div>
    </BlockEditorContext.Provider>
  );
}

function Content() {
  const { editor } = useBlockEditorContext("Content");
  return <EditorContent editor={editor} />;
}

export const BlockEditor = {
  Root,
  Content,
  Gutter: BlockGutter,
  SlashMenu,
  BubbleToolbar,
  BlockMenu: BlockActionsMenu,
};
