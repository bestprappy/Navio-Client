import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

import { duplicateBlock, findBlockFromSelection, moveBlock, toggleTaskAtSelection } from "../block-commands";
import { parseNoteMarkdown } from "../note-markdown";

/** What the keyboard shortcuts ask of the surrounding UI. */
export type BlockEditorController = {
  openBlockMenu: (pos: number) => void;
  openLinkEditor: () => boolean;
  focusToolbar: () => boolean;
};

export const INERT_CONTROLLER: BlockEditorController = {
  openBlockMenu: () => undefined,
  openLinkEditor: () => false,
  focusToolbar: () => false,
};

/**
 * The editor is created once, but the UI it calls into changes with every
 * render; the controller forwards each call to the handlers set last.
 */
export function createBlockEditorController(): {
  controller: BlockEditorController;
  setHandlers: (handlers: BlockEditorController) => void;
} {
  let current = INERT_CONTROLLER;
  return {
    controller: {
      openBlockMenu: (pos) => current.openBlockMenu(pos),
      openLinkEditor: () => current.openLinkEditor(),
      focusToolbar: () => current.focusToolbar(),
    },
    setHandlers: (handlers) => {
      current = handlers;
    },
  };
}

export const BlockKeymap = Extension.create<{ controller: BlockEditorController | null }>({
  name: "noteBlockKeymap",

  addOptions() {
    return { controller: null };
  },

  addKeyboardShortcuts() {
    const editor = this.editor;
    const current = () => findBlockFromSelection(editor.state);
    const move = (direction: -1 | 1) => {
      const target = current();
      return target ? moveBlock(editor, target, direction) : false;
    };

    return {
      "Mod-d": () => {
        const target = current();
        return target ? duplicateBlock(editor, target) : false;
      },
      "Mod-Shift-ArrowUp": () => move(-1),
      "Mod-Shift-ArrowDown": () => move(1),
      "Mod-/": () => {
        const target = current();
        if (!target || !this.options.controller) return false;
        this.options.controller.openBlockMenu(target.pos);
        return true;
      },
      "Mod-k": () => this.options.controller?.openLinkEditor() ?? false,
      "Alt-F10": () => this.options.controller?.focusToolbar() ?? false,
      "Mod-Enter": () => toggleTaskAtSelection(editor),
    };
  },
});

// Lines that start like markdown blocks, or inline markup with both ends present.
const MARKDOWN_HINTS = [
  /^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|---\s*$)/m,
  /(\*\*|__|~~)[^\n]+?\1/,
  /`[^`\n]+`/,
  /\[[^\]\n]+\]\([^)\n]+\)/,
];

/** Plain-text pastes that look like markdown arrive as blocks, as they would in Notion. */
export const MarkdownPaste = Extension.create({
  name: "noteMarkdownPaste",

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("noteMarkdownPaste"),
        props: {
          handlePaste: (_view, event) => {
            const data = event.clipboardData;
            if (!data || data.types.includes("text/html") || editor.isActive("codeBlock")) return false;
            const text = data.getData("text/plain");
            if (!text || !MARKDOWN_HINTS.some((hint) => hint.test(text))) return false;

            const blocks = parseNoteMarkdown(text).content ?? [];
            const single = blocks.length === 1 && blocks[0].type === "paragraph";
            return editor.commands.insertContent(single ? (blocks[0].content ?? []) : blocks);
          },
        },
      }),
    ];
  },
});
