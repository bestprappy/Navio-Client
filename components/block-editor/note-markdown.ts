import type { Blockquote, List, Nodes, PhrasingContent, RootContent, Table } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

import {
  emptyNoteDocument,
  emptyParagraph,
  isCalloutTone,
  isNoteColor,
  isSafeHref,
  toHeadingLevel,
  type CalloutTone,
  type NoteMark,
  type NoteNode,
  type NoteNodeLike,
} from "./note-document";
import { parseEmbed, serializeEmbed, type NoteEmbedCodec } from "./note-embeds";

/**
 * Converts between a note's stored markdown and its block document.
 *
 * <p>Notes stay GitHub-flavoured markdown so they read sensibly anywhere. The
 * blocks plain markdown lacks use GitHub's own conventions: `> [!TIP]` alerts
 * for callouts, `<details>` for toggles, `<u>` for underline, and
 * `<span data-color>` / `<mark data-color>` for text and background colour.
 * Only those exact tags are understood; any other HTML stays literal text.
 *
 * <p>A single newline inside a paragraph is a line break, as it was when notes
 * were plain text, so every existing note keeps its lines.
 *
 * <p>An editor that registers embeds passes their codecs; their HTML lines
 * become embed blocks. Without codecs those lines stay literal text.
 */

const processor = unified().use(remarkParse).use(remarkGfm);

const NO_EMBEDS: readonly NoteEmbedCodec[] = [];

// ---------------------------------------------------------------- parsing

type ParseContext = { source: string; embeds: readonly NoteEmbedCodec[] };

const DETAILS_OPEN = /^<details(\s+open(?:="[^"]*")?)?\s*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*)$/i;
const DETAILS_CLOSE = /^<\/details>/i;
const BREAK_TAG = /^<br\s*\/?>$/i;
const CALLOUT_MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$)/i;
const EMPTY_TASK = /^\[([ xX])\]$/;

type InlineTag = { pattern: RegExp; close: RegExp; mark: (match: RegExpExecArray) => NoteMark | null };

const INLINE_TAGS: readonly InlineTag[] = [
  { pattern: /^<u>$/i, close: /^<\/u>$/i, mark: () => ({ type: "underline" }) },
  {
    pattern: /^<span data-color="([a-z]+)">$/i,
    close: /^<\/span>$/i,
    mark: (match) => (isNoteColor(match[1]) ? { type: "textColor", attrs: { color: match[1] } } : null),
  },
  {
    pattern: /^<mark data-color="([a-z]+)">$/i,
    close: /^<\/mark>$/i,
    mark: (match) => (isNoteColor(match[1]) ? { type: "highlight", attrs: { color: match[1] } } : null),
  },
];

export function parseNoteMarkdown(markdown: string, embeds: readonly NoteEmbedCodec[] = NO_EMBEDS): NoteNode {
  const source = markdown.replace(/\r\n?/g, "\n");
  if (!source.trim()) return emptyNoteDocument();
  const content = parseBlocks(source, embeds);
  return { type: "doc", content: content.length ? content : [emptyParagraph()] };
}

function parseBlocks(source: string, embeds: readonly NoteEmbedCodec[]): NoteNode[] {
  return convertBlocks(processor.parse(source).children, { source, embeds });
}

function sourceOf(node: Nodes, context: ParseContext): string {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  return start === undefined || end === undefined ? "" : context.source.slice(start, end);
}

function convertBlocks(children: readonly RootContent[], context: ParseContext): NoteNode[] {
  const blocks: NoteNode[] = [];

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    switch (child.type) {
      case "paragraph":
        blocks.push(paragraph(convertInline(child.children, [], context)));
        break;
      case "heading":
        blocks.push({
          type: "heading",
          attrs: { level: toHeadingLevel(child.depth) },
          ...withContent(convertInline(child.children, [], context)),
        });
        break;
      case "thematicBreak":
        blocks.push({ type: "horizontalRule" });
        break;
      case "code":
        blocks.push({
          type: "codeBlock",
          attrs: { language: child.lang || null },
          ...withContent(child.value ? [{ type: "text", text: child.value }] : []),
        });
        break;
      case "blockquote":
        blocks.push(convertBlockquote(child, context));
        break;
      case "list":
        blocks.push(...convertList(child, context));
        break;
      case "table":
        blocks.push(...convertTable(child, context));
        break;
      case "html": {
        const embed = parseEmbed(child.value, context.embeds);
        const details = embed ? null : DETAILS_OPEN.exec(child.value.trim());
        if (embed) {
          blocks.push(embed);
        } else if (details) {
          index = convertDetails(details, children, index, context, blocks);
        } else if (BREAK_TAG.test(child.value.trim())) {
          blocks.push(emptyParagraph());
        } else {
          blocks.push(literalParagraph(child.value));
        }
        break;
      }
      default:
        blocks.push(literalParagraph(sourceOf(child, context)));
    }
  }

  return blocks;
}

/** Handles `<details>`; returns the index of the last sibling it consumed. */
function convertDetails(
  match: RegExpExecArray,
  siblings: readonly RootContent[],
  index: number,
  context: ParseContext,
  blocks: NoteNode[],
): number {
  const open = Boolean(match[1]);
  const summary = summaryNodes(match[2]);
  const rest = match[3].trim();

  // Written on one HTML block, as other tools do: <details>…</details> with no blank lines.
  const closeAt = rest.search(/<\/details>\s*$/i);
  if (closeAt !== -1) {
    blocks.push(detailsNode(open, summary, parseBlocks(rest.slice(0, closeAt), context.embeds)));
    return index;
  }

  const content: RootContent[] = [];
  let depth = 0;
  let cursor = index + 1;
  let trailing = "";
  for (; cursor < siblings.length; cursor += 1) {
    const sibling = siblings[cursor];
    if (sibling.type === "html") {
      const value = sibling.value.trim();
      if (DETAILS_OPEN.test(value)) depth += 1;
      if (DETAILS_CLOSE.test(value)) {
        if (depth === 0) {
          trailing = value.replace(DETAILS_CLOSE, "").trim();
          break;
        }
        depth -= 1;
      }
    }
    content.push(sibling);
  }

  const leading = rest ? parseBlocks(rest, context.embeds) : [];
  blocks.push(detailsNode(open, summary, [...leading, ...convertBlocks(content, context)]));
  if (trailing) blocks.push(...parseBlocks(trailing, context.embeds));
  return cursor;
}

function detailsNode(open: boolean, summary: NoteNode[], content: NoteNode[]): NoteNode {
  return {
    type: "details",
    attrs: { open },
    content: [
      { type: "detailsSummary", ...withContent(summary) },
      { type: "detailsContent", content: content.length ? content : [emptyParagraph()] },
    ],
  };
}

/** A toggle's summary holds text only: line breaks become spaces. */
function summaryNodes(summary: string): NoteNode[] {
  const first = processor.parse(summary.trim()).children[0];
  if (!first || first.type !== "paragraph") return summary.trim() ? [{ type: "text", text: summary.trim() }] : [];
  const inline = convertInline(first.children, [], { source: summary.trim(), embeds: NO_EMBEDS }).map((node) =>
    node.type === "hardBreak" ? { type: "text", text: " " } : node,
  );
  return mergeText(inline);
}

function convertBlockquote(node: Blockquote, context: ParseContext): NoteNode {
  const [first, ...rest] = node.children;
  const marker = first?.type === "paragraph" ? CALLOUT_MARKER.exec(sourceOf(first, context)) : null;

  if (first?.type === "paragraph" && marker) {
    const tone = marker[1].toLowerCase();
    const remainder = convertInline(first.children, [], context);
    const body = stripCalloutMarker(remainder);
    const content = [...(body.length ? [paragraph(body)] : []), ...convertBlocks(rest, context)];
    return {
      type: "callout",
      attrs: { tone: isCalloutTone(tone) ? tone : "note" },
      content: content.length ? content : [emptyParagraph()],
    };
  }

  const content = convertBlocks(node.children, context);
  return { type: "blockquote", content: content.length ? content : [emptyParagraph()] };
}

/** Removes the leading `[!TIP]` text and the line break after it. */
function stripCalloutMarker(nodes: NoteNode[]): NoteNode[] {
  const [first, ...rest] = nodes;
  if (!first || first.type !== "text" || !first.text) return nodes;
  const text = first.text.replace(/^\[![A-Za-z]+\][ \t]*/, "");
  const remaining = text ? [{ ...first, text }, ...rest] : rest;
  return remaining[0]?.type === "hardBreak" ? remaining.slice(1) : remaining;
}

function convertList(node: List, context: ParseContext): NoteNode[] {
  type Item = { task: boolean; checked: boolean; content: NoteNode[] };

  const items: Item[] = node.children.map((item) => {
    const content = convertBlocks(item.children, context);
    if (typeof item.checked === "boolean") return { task: true, checked: item.checked, content };

    // GFM needs text after `[ ]`, so an empty to-do is stored as a bare `- [ ]`.
    const first = item.children[0];
    const emptyTask = first?.type === "paragraph" ? EMPTY_TASK.exec(sourceOf(first, context).trim()) : null;
    if (emptyTask) return { task: true, checked: emptyTask[1] !== " ", content: [emptyParagraph(), ...content.slice(1)] };
    return { task: false, checked: false, content };
  });

  // A markdown list can mix to-dos with plain items; the editor keeps them as separate lists.
  const lists: NoteNode[] = [];
  let runStart = 0;
  for (let index = 1; index <= items.length; index += 1) {
    if (index < items.length && items[index].task === items[runStart].task) continue;
    const run = items.slice(runStart, index);
    if (run[0].task) {
      lists.push({
        type: "taskList",
        content: run.map((item) => ({ type: "taskItem", attrs: { checked: item.checked }, content: listItemContent(item.content) })),
      });
    } else if (node.ordered) {
      lists.push({
        type: "orderedList",
        attrs: { start: (node.start ?? 1) + runStart },
        content: run.map((item) => ({ type: "listItem", content: listItemContent(item.content) })),
      });
    } else {
      lists.push({
        type: "bulletList",
        content: run.map((item) => ({ type: "listItem", content: listItemContent(item.content) })),
      });
    }
    runStart = index;
  }
  return lists;
}

/** A list item always starts with a paragraph. */
function listItemContent(content: NoteNode[]): NoteNode[] {
  return content[0]?.type === "paragraph" ? content : [emptyParagraph(), ...content];
}

function convertTable(node: Table, context: ParseContext): NoteNode[] {
  return node.children.map((row) =>
    paragraph(
      mergeText(
        row.children.flatMap((cell, index) => [
          ...(index > 0 ? [{ type: "text", text: " | " }] : []),
          ...convertInline(cell.children, [], context),
        ]),
      ),
    ),
  );
}

function convertInline(children: readonly PhrasingContent[], marks: readonly NoteMark[], context: ParseContext): NoteNode[] {
  const nodes: NoteNode[] = [];
  // Tags like <u> open in one sibling and close in a later one.
  const tagMarks: { mark: NoteMark; close: RegExp }[] = [];
  const current = () => [...marks, ...tagMarks.map((entry) => entry.mark)];

  for (const child of children) {
    switch (child.type) {
      case "text":
        nodes.push(...textWithBreaks(child.value, current()));
        break;
      case "emphasis":
        nodes.push(...convertInline(child.children, [...current(), { type: "italic" }], context));
        break;
      case "strong":
        nodes.push(...convertInline(child.children, [...current(), { type: "bold" }], context));
        break;
      case "delete":
        nodes.push(...convertInline(child.children, [...current(), { type: "strike" }], context));
        break;
      case "inlineCode":
        nodes.push(textNode(child.value, [{ type: "code" }]));
        break;
      case "break":
        nodes.push({ type: "hardBreak" });
        break;
      case "link": {
        const linkMarks = isSafeHref(child.url) ? [...current(), { type: "link", attrs: { href: child.url } }] : current();
        nodes.push(...convertInline(child.children, linkMarks, context));
        break;
      }
      case "image": {
        // Images become links: a note can reach a public plan, and an image would
        // make every visitor's browser fetch from wherever the author pointed it.
        const label = child.alt || child.url;
        const imageMarks = isSafeHref(child.url) ? [...current(), { type: "link", attrs: { href: child.url } }] : current();
        nodes.push(textNode(label, imageMarks));
        break;
      }
      case "html": {
        const value = child.value.trim();
        if (BREAK_TAG.test(value)) {
          nodes.push({ type: "hardBreak" });
          break;
        }
        const closing = tagMarks.findLastIndex((entry) => entry.close.test(value));
        if (closing !== -1) {
          tagMarks.splice(closing, 1);
          break;
        }
        const opened = openInlineTag(value);
        if (opened) tagMarks.push(opened);
        else nodes.push(...textWithBreaks(child.value, current()));
        break;
      }
      default:
        nodes.push(...textWithBreaks(sourceOf(child, context), current()));
    }
  }

  return mergeText(nodes.filter((node) => node.type !== "text" || node.text));
}

function openInlineTag(value: string): { mark: NoteMark; close: RegExp } | null {
  for (const tag of INLINE_TAGS) {
    const match = tag.pattern.exec(value);
    const mark = match ? tag.mark(match) : null;
    if (mark) return { mark, close: tag.close };
  }
  return null;
}

function textWithBreaks(value: string, marks: readonly NoteMark[]): NoteNode[] {
  return value.split("\n").flatMap((line, index) => [
    ...(index > 0 ? [{ type: "hardBreak" }] : []),
    ...(line ? [textNode(line, marks)] : []),
  ]);
}

function textNode(text: string, marks: readonly NoteMark[]): NoteNode {
  const normalized = normalizeMarks(marks);
  return normalized.length ? { type: "text", text, marks: normalized } : { type: "text", text };
}

function literalParagraph(value: string): NoteNode {
  return paragraph(textWithBreaks(value.replace(/\n+$/, ""), []));
}

function paragraph(content: NoteNode[]): NoteNode {
  return { type: "paragraph", ...withContent(content) };
}

function withContent(content: NoteNode[]): { content?: NoteNode[] } {
  return content.length ? { content } : {};
}

function mergeText(nodes: NoteNode[]): NoteNode[] {
  const merged: NoteNode[] = [];
  for (const node of nodes) {
    const previous = merged.at(-1);
    if (previous?.type === "text" && node.type === "text" && marksKey(previous.marks) === marksKey(node.marks)) {
      merged[merged.length - 1] = { ...previous, text: `${previous.text ?? ""}${node.text ?? ""}` };
    } else {
      merged.push(node);
    }
  }
  return merged;
}

// ---------------------------------------------------------------- marks

/** Outermost first. Code is never combined with another mark, as in the editor. */
const MARK_ORDER = ["link", "highlight", "textColor", "bold", "italic", "strike", "underline"] as const;
type OrderedMark = (typeof MARK_ORDER)[number];

function isOrderedMark(type: string): type is OrderedMark {
  return (MARK_ORDER as readonly string[]).includes(type);
}

function markKey(mark: NoteMark): string {
  const attrs = mark.attrs ?? {};
  if (mark.type === "link") return `link:${String(attrs.href ?? "")}`;
  if (mark.type === "textColor" || mark.type === "highlight") return `${mark.type}:${String(attrs.color ?? "")}`;
  return mark.type;
}

function marksKey(marks: readonly NoteMark[] | undefined): string {
  return (marks ?? []).map(markKey).join("|");
}

/** Keeps one mark of each kind (the innermost wins) in a fixed order, and only known, valid marks. */
function normalizeMarks(marks: readonly NoteMark[]): NoteMark[] {
  if (marks.some((mark) => mark.type === "code")) return [{ type: "code" }];
  const byType = new Map<OrderedMark, NoteMark>();
  for (const mark of marks) {
    if (!isOrderedMark(mark.type)) continue;
    if (mark.type === "link" && !isSafeHref(mark.attrs?.href)) continue;
    if ((mark.type === "textColor" || mark.type === "highlight") && !isNoteColor(mark.attrs?.color)) continue;
    byType.set(mark.type, mark.attrs ? { type: mark.type, attrs: { ...mark.attrs } } : { type: mark.type });
  }
  return MARK_ORDER.flatMap((type) => {
    const mark = byType.get(type);
    return mark ? [mark] : [];
  });
}

// ---------------------------------------------------------------- serializing

export function serializeNoteMarkdown(doc: NoteNodeLike, embeds: readonly NoteEmbedCodec[] = NO_EMBEDS): string {
  const blocks = [...(doc.content ?? [])];
  // Empty lines at the very start or end of a note are not worth keeping.
  while (blocks.length && isBlankParagraph(blocks[0])) blocks.shift();
  while (blocks.length && isBlankParagraph(blocks[blocks.length - 1])) blocks.pop();
  return serializeBlocks(blocks, false, embeds);
}

function isBlankParagraph(node: NoteNodeLike | undefined): boolean {
  return node?.type === "paragraph" && !(node.content ?? []).some((child) => child.type !== "text" || child.text?.trim());
}

function serializeBlocks(nodes: readonly NoteNodeLike[], inListItem: boolean, embeds: readonly NoteEmbedCodec[]): string {
  let output = "";
  let previousBullet: "-" | "*" | null = null;
  let previousDelimiter: "." | ")" | null = null;

  nodes.forEach((node, index) => {
    let text: string;
    if (node.type === "bulletList" || node.type === "taskList") {
      // Two lists in a row with the same marker would merge into one.
      const bullet = previousBullet === "-" ? "*" : "-";
      text = serializeList(node, (item) => (node.type === "taskList" ? `${bullet} [${item.attrs?.checked ? "x" : " "}] ` : `${bullet} `), 2, embeds);
      previousBullet = bullet;
      previousDelimiter = null;
    } else if (node.type === "orderedList") {
      const delimiter = previousDelimiter === "." ? ")" : ".";
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : 1;
      text = serializeOrderedList(node, start, delimiter, embeds);
      previousDelimiter = delimiter;
      previousBullet = null;
    } else {
      text = serializeBlock(node, nodes.length === 1, embeds);
      previousBullet = null;
      previousDelimiter = null;
    }

    if (index > 0) {
      const previous = nodes[index - 1];
      const tight = inListItem && previous.type === "paragraph" && (node.type === "bulletList" || node.type === "taskList");
      output += tight ? "\n" : "\n\n";
    }
    output += text;
  });

  return output;
}

function serializeBlock(node: NoteNodeLike, isOnlyChild: boolean, embeds: readonly NoteEmbedCodec[]): string {
  const embed = embeds.find((codec) => codec.name === node.type);
  if (embed) return serializeEmbed(embed, node.attrs ?? {}) ?? "";

  switch (node.type) {
    case "paragraph": {
      if (isBlankParagraph(node)) return isOnlyChild ? "" : "<br>";
      return serializeInline(node.content ?? [], "paragraph");
    }
    case "heading": {
      const level = toHeadingLevel(node.attrs?.level);
      const text = serializeInline(node.content ?? [], "heading").replace(/#$/, "\\#");
      return `${"#".repeat(level)} ${text}`.trimEnd();
    }
    case "horizontalRule":
      return "---";
    case "codeBlock": {
      const code = (node.content ?? []).map((child) => child.text ?? "").join("");
      const language = typeof node.attrs?.language === "string" ? node.attrs.language.replace(/[`\s]/g, "") : "";
      const fence = "`".repeat(Math.max(3, longestRun(code, "`") + 1));
      return code ? `${fence}${language}\n${code}\n${fence}` : `${fence}${language}\n${fence}`;
    }
    case "blockquote": {
      const body = serializeBlocks(node.content ?? [], false, embeds);
      return body ? quote(body) : ">";
    }
    case "callout": {
      const requestedTone = node.attrs?.tone;
      const tone: CalloutTone = isCalloutTone(requestedTone) ? requestedTone : "note";
      const body = serializeBlocks(node.content ?? [], false, embeds);
      return `> [!${tone.toUpperCase()}]${body ? `\n>\n${quote(body)}` : ""}`;
    }
    case "details": {
      const summary = node.content?.find((child) => child.type === "detailsSummary");
      const content = node.content?.find((child) => child.type === "detailsContent");
      const body = serializeBlocks(content?.content ?? [], false, embeds);
      const open = node.attrs?.open ? " open" : "";
      const summaryText = serializeInline(summary?.content ?? [], "heading");
      return `<details${open}>\n<summary>${summaryText}</summary>\n\n${body ? `${body}\n\n` : ""}</details>`;
    }
    default:
      // Unknown blocks keep their text rather than disappearing.
      return node.content ? serializeBlocks(node.content, false, embeds) : serializeInline([node], "paragraph");
  }
}

function serializeList(
  node: NoteNodeLike,
  marker: (item: NoteNodeLike) => string,
  indentWidth: number,
  embeds: readonly NoteEmbedCodec[],
): string {
  return (node.content ?? []).map((item) => serializeListItem(item, marker(item), indentWidth, embeds)).join("\n");
}

function serializeOrderedList(node: NoteNodeLike, start: number, delimiter: "." | ")", embeds: readonly NoteEmbedCodec[]): string {
  const items = node.content ?? [];
  const width = `${start + items.length - 1}${delimiter} `.length;
  return items
    .map((item, index) => serializeListItem(item, `${start + index}${delimiter} `.padEnd(width, " "), width, embeds))
    .join("\n");
}

function serializeListItem(item: NoteNodeLike, marker: string, indentWidth: number, embeds: readonly NoteEmbedCodec[]): string {
  const lines = serializeBlocks(item.content ?? [], true, embeds).split("\n");
  const indent = " ".repeat(indentWidth);
  const [first = "", ...rest] = lines;
  const head = first === "<br>" && lines.length === 1 ? "" : first;
  return [`${marker}${head}`.trimEnd(), ...rest.map((line) => (line ? `${indent}${line}` : ""))].join("\n");
}

function quote(body: string): string {
  return body
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

function longestRun(text: string, character: string): number {
  let longest = 0;
  let current = 0;
  for (const char of text) {
    current = char === character ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

type StackEntry = { key: string; close: string };

/**
 * Writes inline content with its marks. Marks open and close like a stack, so
 * the tags and delimiters always nest properly; whitespace at the edge of a
 * mark is moved outside it, since `** bold**` is not bold in markdown.
 */
function serializeInline(nodes: readonly NoteNodeLike[], context: "paragraph" | "heading"): string {
  const items = nodes.map((node) => ({ node, marks: normalizeMarks(node.marks ?? []) }));
  // Whitespace-only text takes only the marks its neighbours share, so it never opens a mark.
  items.forEach((item, index) => {
    if (item.node.type !== "text" || (item.node.text ?? "").trim()) return;
    const before = items[index - 1]?.marks ?? [];
    const after = items[index + 1]?.marks ?? [];
    const shared = new Set(after.map(markKey));
    item.marks = before.filter((mark) => shared.has(markKey(mark)) && mark.type !== "code");
  });

  let output = "";
  let pendingSpace = "";
  const stack: StackEntry[] = [];

  const closeFrom = (depth: number) => {
    while (stack.length > depth) output += stack.pop()?.close ?? "";
  };

  items.forEach(({ node, marks }, index) => {
    const isCode = marks.length === 1 && marks[0].type === "code";
    const wanted = isCode ? [] : marks;
    const wantedKeys = wanted.map(markKey);

    let keep = 0;
    while (keep < stack.length && wantedKeys.includes(stack[keep].key)) keep += 1;
    closeFrom(keep);
    output += pendingSpace;
    pendingSpace = "";

    if (node.type === "hardBreak") {
      const lineHasText = output !== "" && !output.endsWith("\n");
      const next = items[index + 1]?.node;
      const asNewline = context === "paragraph" && lineHasText && next?.type === "text";
      output += asNewline ? "\n" : "<br>";
      return;
    }
    if (node.type !== "text") return;

    const raw = (node.text ?? "").replace(/\n/g, " ");
    const lead = /^\s*/.exec(raw)?.[0] ?? "";
    const trail = raw.length > lead.length ? (/\s*$/.exec(raw)?.[0] ?? "") : "";
    const core = raw.slice(lead.length, raw.length - trail.length);
    output += lead;

    const openKeys = stack.map((entry) => entry.key);
    for (const mark of wanted) {
      const key = markKey(mark);
      if (openKeys.includes(key)) continue;
      const [open, close] = delimiters(mark);
      output += open;
      stack.push({ key, close });
    }

    const atLineStart = output === "" || output.endsWith("\n");
    output += isCode ? codeSpan(core) : escapeText(core, atLineStart);
    pendingSpace = trail;
  });

  closeFrom(0);
  return output + pendingSpace.replace(/[ \t]+$/, "");
}

function delimiters(mark: NoteMark): [string, string] {
  switch (mark.type) {
    case "bold":
      return ["**", "**"];
    case "italic":
      return ["*", "*"];
    case "strike":
      return ["~~", "~~"];
    case "underline":
      return ["<u>", "</u>"];
    case "textColor":
      return [`<span data-color="${String(mark.attrs?.color)}">`, "</span>"];
    case "highlight":
      return [`<mark data-color="${String(mark.attrs?.color)}">`, "</mark>"];
    case "link":
      return ["[", `](${linkDestination(String(mark.attrs?.href ?? ""))})`];
    default:
      return ["", ""];
  }
}

function linkDestination(href: string): string {
  return /[\s()<>]/.test(href) ? `<${href.replace(/[<>]/g, (char) => encodeURIComponent(char))}>` : href;
}

function codeSpan(text: string): string {
  const fence = "`".repeat(longestRun(text, "`") + 1);
  const pad = text.startsWith("`") || text.endsWith("`") || (/^ .* $/.test(text) && text.trim()) ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}

function escapeText(text: string, atLineStart: boolean): string {
  let escaped = text.replace(/[\\`*_[\]<>~|&]/g, "\\$&");
  if (atLineStart) {
    escaped = escaped.replace(/^([#+=-])/, "\\$1").replace(/^(\d{1,9})([.)])/, "$1\\$2");
  }
  return escaped;
}
