import { Extension, type Editor, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { exitSuggestion, type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";

import { applyBlockTypeAtCaret } from "../block-commands";
import { filterBlockTypes, type BlockType } from "../block-types";

/**
 * Typing "/" opens the block menu at the caret. The suggestion plugin finds the
 * query; this store hands it to the React menu and takes its keystrokes.
 */

export type SlashMenuState = {
  open: boolean;
  query: string;
  items: readonly BlockType[];
  activeIndex: number;
  /** Rectangle of the "/" and the typed query, in viewport coordinates. */
  getAnchorRect: (() => DOMRect | null) | null;
};

const CLOSED: SlashMenuState = { open: false, query: "", items: [], activeIndex: 0, getAnchorRect: null };

export const SLASH_MENU_KEY = new PluginKey("noteSlashMenu");

export type SlashMenuStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => SlashMenuState;
  setActiveIndex: (index: number) => void;
  select: (index: number) => void;
  close: () => void;
};

export function createSlashMenuStore(): SlashMenuStore & {
  bind: (props: SuggestionProps<BlockType, BlockType>) => void;
  unbind: () => void;
  handleKeyDown: (props: SuggestionKeyDownProps) => boolean;
} {
  let state = CLOSED;
  let command: ((item: BlockType) => void) | null = null;
  let editor: Editor | null = null;
  const listeners = new Set<() => void>();

  const set = (next: SlashMenuState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  const select = (index: number) => {
    const item = state.items[index];
    if (item && command) command(item);
  };

  const close = () => {
    if (editor) exitSuggestion(editor.view, SLASH_MENU_KEY);
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    setActiveIndex(index) {
      if (index !== state.activeIndex) set({ ...state, activeIndex: index });
    },
    select,
    close,
    bind(props) {
      editor = props.editor;
      command = props.command;
      const sameQuery = state.open && state.query === props.query;
      set({
        open: true,
        query: props.query,
        items: props.items,
        activeIndex: sameQuery ? Math.min(state.activeIndex, Math.max(0, props.items.length - 1)) : 0,
        getAnchorRect: props.clientRect ?? null,
      });
    },
    unbind() {
      command = null;
      set(CLOSED);
    },
    handleKeyDown({ event }) {
      if (!state.open) return false;
      const count = state.items.length;
      switch (event.key) {
        case "ArrowDown":
          if (count) set({ ...state, activeIndex: (state.activeIndex + 1) % count });
          return true;
        case "ArrowUp":
          if (count) set({ ...state, activeIndex: (state.activeIndex - 1 + count) % count });
          return true;
        case "Home":
          if (count) set({ ...state, activeIndex: 0 });
          return count > 0;
        case "End":
          if (count) set({ ...state, activeIndex: count - 1 });
          return count > 0;
        case "Enter":
        case "Tab":
          if (!count) return false;
          select(state.activeIndex);
          return true;
        case "Escape":
          close();
          return true;
        default:
          return false;
      }
    },
  };
}

export type SlashCommandOptions = { store: ReturnType<typeof createSlashMenuStore> | null };

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return { store: null };
  },

  addProseMirrorPlugins() {
    const { store } = this.options;
    if (!store) return [];
    return [
      Suggestion<BlockType, BlockType>({
        editor: this.editor,
        pluginKey: SLASH_MENU_KEY,
        char: "/",
        allow: ({ state, range }) => state.doc.resolve(range.from).parent.type.name !== "codeBlock",
        items: ({ query }) => filterBlockTypes(query),
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: BlockType }) =>
          applyBlockTypeAtCaret(editor, props.id, range),
        render: () => ({
          onStart: (props) => store.bind(props),
          onUpdate: (props) => store.bind(props),
          onExit: () => store.unbind(),
          onKeyDown: (props) => store.handleKeyDown(props),
        }),
      }),
    ];
  },
});
