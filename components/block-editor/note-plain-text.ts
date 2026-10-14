import type { NoteNode } from "./note-document";
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
