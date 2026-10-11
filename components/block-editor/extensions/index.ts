import type { Extensions } from "@tiptap/core";
import { DetailsSummary } from "@tiptap/extension-details";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";

import { isSafeHref } from "../note-document";
import { BlockKeymap, MarkdownPaste, type BlockEditorController } from "./block-keymap";
import { Callout, Highlight, NoteDetails, NoteDetailsContent, NoteHeading, TextColor } from "./note-schema";
import { SlashCommand, type createSlashMenuStore } from "./slash-command";

export const DROP_CURSOR_CLASS = "note-drop-cursor";

type NoteExtensionOptions = {
  placeholder: string;
  slashStore: ReturnType<typeof createSlashMenuStore>;
  controller: BlockEditorController;
};

export function createNoteExtensions({ placeholder, slashStore, controller }: NoteExtensionOptions): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        isAllowedUri: (url) => isSafeHref(url),
        HTMLAttributes: { rel: "noopener noreferrer nofollow ugc", target: "_blank" },
      },
      dropcursor: { color: false, width: 2, class: DROP_CURSOR_CLASS },
    }),
    NoteHeading,
    TaskList,
    TaskItem.configure({
      nested: true,
      a11y: { checkboxLabel: (node, checked) => `${checked ? "Done" : "To do"}: ${node.textContent || "empty item"}` },
    }),
    NoteDetails,
    DetailsSummary,
    NoteDetailsContent,
    Callout,
    TextColor,
    Highlight,
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: true,
      placeholder: ({ editor, node, pos }) => {
        if (node.type.name === "heading") return `Heading ${String(node.attrs.level)}`;
        if (node.type.name === "detailsSummary") return "Toggle";
        if (node.type.name === "codeBlock") return "";
        if (editor.isEmpty) return placeholder;
        const parent = editor.state.doc.resolve(pos).parent.type.name;
        if (parent === "listItem" || parent === "taskItem") return "List";
        return "Type / for commands";
      },
    }),
    SlashCommand.configure({ store: slashStore }),
    BlockKeymap.configure({ controller }),
    MarkdownPaste,
  ];
}
