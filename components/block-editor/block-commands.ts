import type { ChainedCommands, CommandProps, Editor } from "@tiptap/core";
import { Fragment, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Selection, TextSelection, type EditorState } from "@tiptap/pm/state";
import { liftTarget } from "@tiptap/pm/transform";

import type { BlockTypeId } from "./block-types";
import { isNoteColor, type NoteColor } from "./note-document";

/**
 * Block-level operations shared by the gutter, the slash menu, the selection
 * toolbar, the block menu and the keyboard shortcuts.
 *
 * <p>A "block" is what the gutter handle grabs: a child of the note, of a
 * toggle's content, or an item of a list. Paragraphs inside a quote or callout
 * belong to that quote or callout.
 */

const LIST_TYPES = new Set(["bulletList", "orderedList", "taskList"]);
const CONTAINER_TYPES = new Set(["doc", "detailsContent", ...LIST_TYPES]);

export type BlockTarget = { pos: number; node: ProseMirrorNode; parent: ProseMirrorNode; index: number };

export function findBlockAt(doc: ProseMirrorNode, position: number): BlockTarget | null {
  const $pos = doc.resolve(Math.max(0, Math.min(position, doc.content.size)));

  // Between two blocks: take the one after, else the one before.
  if (CONTAINER_TYPES.has($pos.parent.type.name)) {
    const index = $pos.index();
    const after = $pos.nodeAfter;
    if (after) return { pos: $pos.pos, node: after, parent: $pos.parent, index };
    const before = $pos.nodeBefore;
    if (before) return { pos: $pos.pos - before.nodeSize, node: before, parent: $pos.parent, index: index - 1 };
  }

  for (let depth = $pos.depth; depth >= 1; depth -= 1) {
    const parent = $pos.node(depth - 1);
    if (CONTAINER_TYPES.has(parent.type.name)) {
      return { pos: $pos.before(depth), node: $pos.node(depth), parent, index: $pos.index(depth - 1) };
    }
  }
  return null;
}

export function findBlockFromSelection(state: EditorState): BlockTarget | null {
  const { selection } = state;
  if (selection instanceof NodeSelection && CONTAINER_TYPES.has(selection.$from.parent.type.name)) {
    return { pos: selection.from, node: selection.node, parent: selection.$from.parent, index: selection.$from.index() };
  }
  return findBlockAt(state.doc, selection.from);
}

/** The block's current block type, as the menus name it. */
export function getBlockTypeId(target: Pick<BlockTarget, "node" | "parent">): BlockTypeId {
  switch (target.node.type.name) {
    case "heading": {
      const level = Number(target.node.attrs.level);
      return level === 2 ? "heading2" : level === 3 ? "heading3" : level === 4 ? "heading4" : "heading1";
    }
    case "listItem":
      return target.parent.type.name === "orderedList" ? "orderedList" : "bulletList";
    case "taskItem":
      return "taskList";
    case "details":
      return "toggle";
    case "blockquote":
      return "quote";
    case "callout":
      return "callout";
    case "codeBlock":
      return "codeBlock";
    case "horizontalRule":
      return "divider";
    default:
      return "paragraph";
  }
}

/** Position of the end of the block's first line of text, or null for a divider. */
function firstTextEnd(target: BlockTarget): number | null {
  if (target.node.isTextblock) return target.pos + target.node.nodeSize - 1;
  let found: number | null = null;
  target.node.descendants((child, offset) => {
    if (found !== null) return false;
    if (child.isTextblock) {
      found = target.pos + 1 + offset + child.nodeSize - 1;
      return false;
    }
    return true;
  });
  return found;
}

export function focusBlock(editor: Editor, target: BlockTarget): void {
  const end = firstTextEnd(target);
  if (end === null) {
    editor.chain().focus(undefined, { scrollIntoView: false }).setNodeSelection(target.pos).run();
    return;
  }
  editor.chain().focus(undefined, { scrollIntoView: false }).setTextSelection(end).run();
}

/** Plugin key of the selection toolbar, so block actions can hide it at once. */
export const SELECTION_TOOLBAR_KEY = "noteSelectionToolbar";

/** Selects a whole block (its menu is about to open), hiding the selection toolbar in the same step. */
export function selectBlock(editor: Editor, target: BlockTarget): void {
  const { tr } = editor.state;
  tr.setSelection(NodeSelection.create(editor.state.doc, target.pos)).setMeta(SELECTION_TOOLBAR_KEY, "hide");
  editor.view.dispatch(tr);
}

/** Keeps the caret at the same place inside a block after the block moved. */
function selectionAfterMove(editor: Editor, from: number, to: number, size: number): (tr: EditorState["tr"]) => void {
  const { selection } = editor.state;
  return (tr) => {
    if (selection instanceof NodeSelection) {
      tr.setSelection(NodeSelection.create(tr.doc, to));
      return;
    }
    const offset = selection.from - from;
    const inside = offset > 0 && offset < size;
    const target = inside ? to + offset : to + 1;
    tr.setSelection(Selection.near(tr.doc.resolve(Math.min(target, tr.doc.content.size))));
  };
}

export function moveBlock(editor: Editor, target: BlockTarget, direction: -1 | 1): boolean {
  const sibling = target.parent.maybeChild(target.index + direction);
  if (!sibling) return false;

  const { tr } = editor.state;
  const size = target.node.nodeSize;
  const restoreSelection = selectionAfterMove(editor, target.pos, direction === -1 ? target.pos - sibling.nodeSize : target.pos + sibling.nodeSize, size);
  tr.delete(target.pos, target.pos + size);
  const insertAt = direction === -1 ? target.pos - sibling.nodeSize : target.pos + sibling.nodeSize;
  tr.insert(insertAt, target.node);
  restoreSelection(tr);
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

export function duplicateBlock(editor: Editor, target: BlockTarget): boolean {
  const { tr } = editor.state;
  const copyAt = target.pos + target.node.nodeSize;
  tr.insert(copyAt, target.node.copy(target.node.content));
  selectionAfterMove(editor, target.pos, copyAt, target.node.nodeSize)(tr);
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

export function deleteBlock(editor: Editor, target: BlockTarget): boolean {
  const { state } = editor;
  const { tr } = state;
  let from = target.pos;
  let to = target.pos + target.node.nodeSize;

  // Removing the only item of a list removes the list.
  let $from = state.doc.resolve(from);
  while ($from.depth > 0 && LIST_TYPES.has($from.parent.type.name) && $from.parent.childCount === 1) {
    from = $from.before();
    to = $from.after();
    $from = state.doc.resolve(from);
  }

  if ($from.parent.childCount === 1) {
    tr.replaceWith(from, to, state.schema.nodes.paragraph.create());
  } else {
    tr.delete(from, to);
  }
  tr.setSelection(Selection.near(tr.doc.resolve(Math.min(from, tr.doc.content.size)), -1));
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

/**
 * Adds an empty block under the target and types "/" in it, which opens the
 * block menu. An empty line is reused rather than adding another.
 */
export function insertBlockBelow(editor: Editor, target: BlockTarget): void {
  const { state } = editor;
  const isEmptyParagraph = target.node.type.name === "paragraph" && target.node.content.size === 0;
  if (isEmptyParagraph) {
    editor.chain().focus().setTextSelection(target.pos + 1).insertContent("/").run();
    return;
  }

  const insertAt = target.pos + target.node.nodeSize;
  const isListItem = target.node.type.name === "listItem" || target.node.type.name === "taskItem";
  const paragraph = state.schema.nodes.paragraph.create();
  const node = isListItem
    ? target.node.type.create(target.node.type.name === "taskItem" ? { checked: false } : null, paragraph)
    : paragraph;
  const { tr } = state;
  tr.insert(insertAt, node);
  tr.setSelection(TextSelection.create(tr.doc, insertAt + (isListItem ? 2 : 1)));
  editor.view.dispatch(tr.scrollIntoView());
  editor.chain().focus().insertContent("/").run();
}

function liftWrapperChildren(pos: number) {
  return ({ tr }: CommandProps): boolean => {
    const node = tr.doc.nodeAt(pos);
    if (!node) return false;
    const range = tr.doc.resolve(pos + 1).blockRange(tr.doc.resolve(pos + node.nodeSize - 1));
    const target = range ? liftTarget(range) : null;
    if (!range || target === null) return false;
    tr.lift(range, target);
    return true;
  };
}

/** Replaces the textblock holding the caret with a toggle whose summary is that text. */
function wrapTextblockInToggle({ tr, state }: CommandProps): boolean {
  const { $from } = tr.selection;
  const textblock = $from.parent;
  const { details, detailsSummary, detailsContent, paragraph } = state.schema.nodes;
  if (!textblock.isTextblock || !details || !detailsSummary || !detailsContent) return false;

  const inline: ProseMirrorNode[] = [];
  textblock.content.forEach((child) => inline.push(child.isText ? child : state.schema.text(" ", child.marks)));
  const summary = detailsSummary.create(null, Fragment.from(inline));
  const toggle = details.create({ open: true }, [summary, detailsContent.create(null, paragraph.create())]);
  const start = $from.before();
  tr.replaceWith(start, $from.after(), toggle);
  tr.setSelection(TextSelection.create(tr.doc, start + 2 + summary.content.size));
  return true;
}

function convertTextblock(chain: ChainedCommands, typeId: BlockTypeId): ChainedCommands {
  switch (typeId) {
    case "paragraph":
      return chain.setParagraph();
    case "heading1":
      return chain.setNode("heading", { level: 1 });
    case "heading2":
      return chain.setNode("heading", { level: 2 });
    case "heading3":
      return chain.setNode("heading", { level: 3 });
    case "heading4":
      return chain.setNode("heading", { level: 4 });
    case "codeBlock":
      return chain.setCodeBlock();
    case "bulletList":
      return chain.setParagraph().toggleBulletList();
    case "orderedList":
      return chain.setParagraph().toggleOrderedList();
    case "taskList":
      return chain.setParagraph().toggleTaskList();
    case "quote":
      return chain.setParagraph().setBlockquote();
    case "callout":
      return chain.setParagraph().wrapIn("callout", { tone: "note" });
    case "toggle":
      return chain.setParagraph().command(wrapTextblockInToggle);
    case "divider":
      return chain;
  }
}

/** Turns a block into another type, keeping its text and its place. */
export function turnBlockInto(editor: Editor, target: BlockTarget, typeId: BlockTypeId): boolean {
  if (typeId === "divider" || getBlockTypeId(target) === typeId) return false;
  const caret = firstTextEnd(target);
  if (caret === null) return false;

  let chain = editor.chain().focus(undefined, { scrollIntoView: false }).setTextSelection(caret);
  switch (target.node.type.name) {
    case "listItem":
    case "taskItem":
      chain = chain.liftListItem(target.node.type.name);
      break;
    case "blockquote":
    case "callout":
      chain = chain.command(liftWrapperChildren(target.pos));
      break;
    case "details":
      chain = chain.unsetDetails();
      break;
  }
  return convertTextblock(chain, typeId).run();
}

/**
 * Applies a block type from the slash menu. An empty line becomes that block;
 * a line with text keeps it and gets the new block underneath, as in Notion.
 */
export function applyBlockTypeAtCaret(editor: Editor, typeId: BlockTypeId, range: { from: number; to: number }): void {
  editor.chain().focus().deleteRange(range).run();
  const target = findBlockFromSelection(editor.state);
  if (!target) return;

  const { $from } = editor.state.selection;
  const lineIsEmpty = $from.parent.isTextblock && $from.parent.content.size === 0;

  if (typeId === "divider") {
    if (lineIsEmpty && target.node.isTextblock) {
      const { tr, schema } = editor.state;
      tr.replaceWith(target.pos, target.pos + target.node.nodeSize, [schema.nodes.horizontalRule.create(), schema.nodes.paragraph.create()]);
      tr.setSelection(TextSelection.create(tr.doc, target.pos + 2));
      editor.view.dispatch(tr.scrollIntoView());
    } else {
      editor.chain().focus().setHorizontalRule().run();
    }
    return;
  }

  if (lineIsEmpty) {
    const current = findBlockFromSelection(editor.state);
    if (current) turnBlockInto(editor, current, typeId);
    return;
  }

  const insertAt = target.pos + target.node.nodeSize;
  const { tr, schema } = editor.state;
  tr.insert(insertAt, schema.nodes.paragraph.create());
  tr.setSelection(TextSelection.create(tr.doc, insertAt + 1));
  editor.view.dispatch(tr);
  const inserted = findBlockFromSelection(editor.state);
  if (inserted && typeId !== "paragraph") turnBlockInto(editor, inserted, typeId);
}

export type ColorKind = "text" | "background";

/** Colours every piece of text in the block; null removes the colour. */
export function setBlockColor(editor: Editor, target: BlockTarget, kind: ColorKind, color: NoteColor | null): void {
  const markName = kind === "text" ? "textColor" : "highlight";
  const markType = editor.schema.marks[markName];
  if (!markType) return;
  const from = target.pos + 1;
  const to = target.pos + target.node.nodeSize - 1;
  const { tr } = editor.state;
  tr.removeMark(from, to, markType);
  if (color) tr.addMark(from, to, markType.create({ color }));
  editor.view.dispatch(tr);
}

/** The colour shared by all of a block's text, if there is one. */
export function getBlockColor(target: BlockTarget, kind: ColorKind): NoteColor | null {
  const markName = kind === "text" ? "textColor" : "highlight";
  const colors = new Set<NoteColor | null>();
  target.node.descendants((child) => {
    if (!child.isText) return true;
    const color: unknown = child.marks.find((mark) => mark.type.name === markName)?.attrs.color;
    colors.add(isNoteColor(color) ? color : null);
    return true;
  });
  return colors.size === 1 ? ([...colors][0] ?? null) : null;
}

/**
 * Starts dragging a whole block from its handle. The block is selected and
 * handed to ProseMirror as the dragged slice, so its own drop handling moves it.
 */
export function startBlockDrag(editor: Editor, pos: number, dataTransfer: DataTransfer): void {
  const { view } = editor;
  const selection = NodeSelection.create(view.state.doc, pos);
  view.dispatch(view.state.tr.setSelection(selection));
  const slice = selection.content();
  const { dom, text } = view.serializeForClipboard(slice);
  dataTransfer.clearData();
  dataTransfer.setData("text/html", dom.innerHTML);
  dataTransfer.setData("text/plain", text);
  dataTransfer.effectAllowed = "copyMove";
  const blockDom = view.nodeDOM(pos);
  if (blockDom instanceof HTMLElement) dataTransfer.setDragImage(blockDom, 0, 0);
  view.dragging = { slice, move: true };
}

export function endBlockDrag(editor: Editor): void {
  editor.view.dragging = null;
}

export function toggleTaskAtSelection(editor: Editor): boolean {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name === "taskItem") {
      const pos = $from.before(depth);
      editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, checked: !node.attrs.checked }));
      return true;
    }
  }
  return false;
}
