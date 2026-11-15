import { CALLOUT_TONE_LABELS, isCalloutTone, isSafeHref, stripNoteFormatTags, type NoteNode } from "./note-document";
import { parseNoteMarkdown } from "./note-markdown";

/** Blocks whose text is one line of the summary: a paragraph, heading or code block. */
const TEXT_BLOCKS = new Set(["paragraph", "heading", "codeBlock", "detailsSummary"]);
const ENDS_A_SENTENCE = /[.!?:;,…。]$/u;

function inlineText(node: NoteNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";
  return (node.content ?? []).map(inlineText).join("");
}

function collectBlocks(node: NoteNode, blocks: string[]): string[] {
  if (TEXT_BLOCKS.has(node.type)) {
    const text = inlineText(node).replace(/\s+/g, " ").trim();
    if (text) blocks.push(text);
    return blocks;
  }
  for (const child of node.content ?? []) collectBlocks(child, blocks);
  return blocks;
}

/**
 * A note's words on one line, without markdown syntax, for places that show a
 * short summary such as a table cell. Headings and list items read as sentences.
 * Falls back to the raw text if parsing fails.
 */
export function getNotePlainText(markdown: string): string {
  if (!markdown.trim()) return "";
  try {
    const blocks = collectBlocks(parseNoteMarkdown(markdown), []);
    return blocks
      .map((text, index) => (index < blocks.length - 1 && !ENDS_A_SENTENCE.test(text) ? `${text}.` : text))
      .join(" ");
  } catch (error) {
    console.warn("Could not read note markdown; showing it as typed.", {
      operation: "getNotePlainText",
      length: markdown.length,
      error,
    });
    return markdown.replace(/\s+/g, " ").trim();
  }
}

/** Inline text with line breaks kept; a link whose words differ from its address shows the address after them. */
function exportInline(nodes: readonly NoteNode[] = []): string {
  let output = "";
  let href: string | null = null;
  let linkText = "";
  const flushLink = () => {
    if (href === null) return;
    const words = linkText.trim();
    const shown = href.replace(/^(?:mailto|tel):/i, "");
    output += words && words !== href && words !== shown ? `${linkText} (${shown})` : linkText || shown;
    href = null;
    linkText = "";
  };

  for (const node of nodes) {
    const link = node.marks?.find((mark) => mark.type === "link");
    const nodeHref = link && isSafeHref(link.attrs?.href) ? String(link.attrs?.href).trim() : null;
    if (nodeHref !== href) flushLink();
    const text = node.type === "text" ? node.text ?? "" : node.type === "hardBreak" ? "\n" : exportInline(node.content);
    if (nodeHref) {
      href = nodeHref;
      linkText += text;
    } else {
      output += text;
    }
  }
  flushLink();
  return output;
}

function rawText(node: NoteNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(rawText).join("");
}

function textLines(text: string): string[] {
  return text.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean);
}

/** A list item's lines: the marker on the first, later lines lined up under its text. */
function itemLines(item: NoteNode, marker: string): string[] {
  const lines = blockLines(item.content);
  const pad = " ".repeat(marker.length);
  return lines.map((line, index) => (index === 0 ? marker : pad) + line);
}

function nodeLines(node: NoteNode): string[] {
  const items = node.content ?? [];
  switch (node.type) {
    case "paragraph":
    case "heading":
    case "detailsSummary":
      return textLines(exportInline(node.content));
    case "codeBlock":
      return rawText(node).split("\n").filter((line) => line.trim());
    case "bulletList":
      return items.flatMap((item) => itemLines(item, "• "));
    case "orderedList": {
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : 1;
      return items.flatMap((item, index) => itemLines(item, `${start + index}. `));
    }
    case "taskList":
      return items.flatMap((item) => itemLines(item, item.attrs?.checked ? "[x] " : "[ ] "));
    case "callout": {
      const lines = blockLines(node.content);
      const tone = isCalloutTone(node.attrs?.tone) ? node.attrs.tone : "note";
      return lines.length ? [`${CALLOUT_TONE_LABELS[tone]}: ${lines[0]}`, ...lines.slice(1)] : [];
    }
    case "horizontalRule":
      return [];
    default:
      // Blockquotes, toggles and their bodies read as their contents; embeds carry none.
      return blockLines(node.content);
  }
}

function blockLines(nodes: readonly NoteNode[] = []): string[] {
  return nodes.flatMap(nodeLines);
}

/**
 * A note as readable plain text for files such as CSV and Excel: one line per
 * paragraph, heading or list item, with list markers ("•", "1.", "[ ]", "[x]")
 * and callout labels, but no markdown syntax or formatting tags. Collapsed
 * toggles are written out in full, since a file cannot expand them.
 */
export function getNoteExportText(markdown: string): string {
  if (!markdown.trim()) return "";
  try {
    return blockLines(parseNoteMarkdown(markdown).content).join("\n");
  } catch (error) {
    console.warn("Could not read note markdown; exporting it without formatting tags.", {
      operation: "getNoteExportText",
      length: markdown.length,
      error,
    });
    return stripNoteFormatTags(markdown);
  }
}
