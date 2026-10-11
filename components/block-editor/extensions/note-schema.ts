import { Mark, Node, mergeAttributes } from "@tiptap/core";
import { Details, DetailsContent } from "@tiptap/extension-details";
import Heading from "@tiptap/extension-heading";
import { TextSelection } from "@tiptap/pm/state";

import {
  CALLOUT_TONES,
  CALLOUT_TONE_LABELS,
  HEADING_TAGS,
  isCalloutTone,
  isNoteColor,
  toHeadingLevel,
  type CalloutTone,
} from "../note-document";

/**
 * The note-specific parts of the editor schema. The DOM they render matches
 * what {@link NoteContent} renders, so a note looks the same before and after
 * it is opened for editing.
 */

export const NoteHeading = Heading.extend({
  parseHTML() {
    return [
      {
        tag: "h4[data-level], h5[data-level], h6[data-level]",
        priority: 60,
        getAttrs: (element) => ({ level: toHeadingLevel(Number(element.getAttribute("data-level"))) }),
      },
      ...this.options.levels.map((level) => ({ tag: `h${level}`, attrs: { level: toHeadingLevel(level) } })),
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const level = toHeadingLevel(node.attrs.level);
    return [HEADING_TAGS[level], mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-level": level }), 0];
  },
}).configure({ levels: [1, 2, 3, 4] });

function colorMark(name: "textColor" | "highlight", tag: "span" | "mark") {
  return Mark.create({
    name,
    addAttributes() {
      return {
        color: {
          default: null,
          parseHTML: (element) => {
            const color = element.getAttribute("data-color");
            return isNoteColor(color) ? color : null;
          },
          renderHTML: (attributes) => (isNoteColor(attributes.color) ? { "data-color": attributes.color } : {}),
        },
      };
    },
    parseHTML() {
      return [{ tag: `${tag}[data-color]`, getAttrs: (element) => (isNoteColor(element.getAttribute("data-color")) ? null : false) }];
    },
    renderHTML({ HTMLAttributes }) {
      return [tag, HTMLAttributes, 0];
    },
  });
}

export const TextColor = colorMark("textColor", "span");
export const Highlight = colorMark("highlight", "mark");

function nextTone(tone: CalloutTone): CalloutTone {
  return CALLOUT_TONES[(CALLOUT_TONES.indexOf(tone) + 1) % CALLOUT_TONES.length];
}

/** Stops a click on a node-view button from moving the caret or blurring the editor. */
function keepSelection(button: HTMLButtonElement) {
  button.addEventListener("mousedown", (event) => event.preventDefault());
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      tone: {
        default: "note",
        parseHTML: (element) => {
          const tone = element.getAttribute("data-tone");
          return isCalloutTone(tone) ? tone : "note";
        },
        renderHTML: (attributes) => ({ "data-tone": attributes.tone }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "callout" }), 0];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.setAttribute("data-type", "callout");

      const button = document.createElement("button");
      button.type = "button";
      button.contentEditable = "false";
      button.setAttribute("data-callout-icon", "");
      keepSelection(button);

      const content = document.createElement("div");
      content.setAttribute("data-callout-body", "");
      dom.append(button, content);

      let current = node;
      const render = () => {
        const tone: CalloutTone = isCalloutTone(current.attrs.tone) ? current.attrs.tone : "note";
        dom.setAttribute("data-tone", tone);
        button.setAttribute("aria-label", `${CALLOUT_TONE_LABELS[tone]} callout. Change to ${CALLOUT_TONE_LABELS[nextTone(tone)]}`);
        button.title = "Change callout type";
        button.disabled = !editor.isEditable;
      };
      render();

      button.addEventListener("click", () => {
        const pos = typeof getPos === "function" ? getPos() : undefined;
        if (typeof pos !== "number" || !editor.isEditable) return;
        const tone: CalloutTone = isCalloutTone(current.attrs.tone) ? current.attrs.tone : "note";
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, tone: nextTone(tone) }));
      });

      return {
        dom,
        contentDOM: content,
        ignoreMutation: (mutation) => mutation.type !== "selection" && button.contains(mutation.target),
        update: (updated) => {
          if (updated.type !== current.type) return false;
          current = updated;
          render();
          return true;
        },
      };
    };
  },
});

/**
 * Toggles keep their open state in the note. The stock node view hides the
 * content for one tick before showing it, which would make an open toggle
 * flicker when a note is opened for editing, so the open state is applied
 * straight away and the content is hidden with CSS.
 */
export const NoteDetails = Details.extend({
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.setAttribute("data-type", "details");

      const button = document.createElement("button");
      button.type = "button";
      button.contentEditable = "false";
      button.setAttribute("data-details-toggle", "");
      keepSelection(button);

      const content = document.createElement("div");
      content.setAttribute("data-details-body", "");
      dom.append(button, content);

      let current = node;
      const render = () => {
        const open = Boolean(current.attrs.open);
        dom.classList.toggle("is-open", open);
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Collapse toggle" : "Expand toggle");
      };
      render();

      button.addEventListener("click", () => {
        const pos = typeof getPos === "function" ? getPos() : undefined;
        if (typeof pos !== "number") return;
        const open = !current.attrs.open;
        const { tr, selection } = editor.state;
        tr.setNodeMarkup(pos, undefined, { ...current.attrs, open });
        // Collapsing a toggle with the caret inside moves the caret to its summary.
        if (!open && selection.from > pos && selection.to < pos + current.nodeSize) {
          const summaryEnd = pos + 1 + (current.firstChild?.nodeSize ?? 2) - 1;
          tr.setSelection(TextSelection.create(tr.doc, summaryEnd));
        }
        editor.view.dispatch(tr);
      });

      return {
        dom,
        contentDOM: content,
        ignoreMutation: (mutation) => mutation.type !== "selection" && button.contains(mutation.target),
        update: (updated) => {
          if (updated.type !== current.type) return false;
          current = updated;
          render();
          return true;
        },
      };
    };
  },
}).configure({ persist: true });

export const NoteDetailsContent = DetailsContent.extend({
  addNodeView() {
    return null;
  },
});
