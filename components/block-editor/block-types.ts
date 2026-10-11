import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListCollapse,
  ListOrdered,
  ListTodo,
  MessageSquareText,
  Minus,
  Quote,
  Type,
  type LucideIcon,
} from "lucide-react";

export type BlockTypeId =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "toggle"
  | "quote"
  | "callout"
  | "codeBlock"
  | "divider";

export type BlockGroup = "text" | "list" | "block";

export type BlockType = {
  id: BlockTypeId;
  label: string;
  icon: LucideIcon;
  group: BlockGroup;
  /** What can be typed at the start of a line to get this block. */
  markdown?: string;
  keywords: readonly string[];
  /** Whether an existing block can be turned into this one. */
  convertible: boolean;
};

export const BLOCK_TYPES: readonly BlockType[] = [
  { id: "paragraph", label: "Text", icon: Type, group: "text", keywords: ["plain", "paragraph", "p"], convertible: true },
  { id: "heading1", label: "Heading 1", icon: Heading1, group: "text", markdown: "#", keywords: ["h1", "title", "big"], convertible: true },
  { id: "heading2", label: "Heading 2", icon: Heading2, group: "text", markdown: "##", keywords: ["h2", "subtitle"], convertible: true },
  { id: "heading3", label: "Heading 3", icon: Heading3, group: "text", markdown: "###", keywords: ["h3"], convertible: true },
  { id: "heading4", label: "Heading 4", icon: Heading4, group: "text", markdown: "####", keywords: ["h4", "small"], convertible: true },
  { id: "bulletList", label: "Bulleted list", icon: List, group: "list", markdown: "-", keywords: ["ul", "unordered", "bullet"], convertible: true },
  { id: "orderedList", label: "Numbered list", icon: ListOrdered, group: "list", markdown: "1.", keywords: ["ol", "ordered", "number"], convertible: true },
  { id: "taskList", label: "To-do list", icon: ListTodo, group: "list", markdown: "[]", keywords: ["todo", "task", "checkbox", "checklist"], convertible: true },
  { id: "toggle", label: "Toggle list", icon: ListCollapse, group: "list", keywords: ["collapse", "expand", "details", "fold"], convertible: true },
  { id: "quote", label: "Quote", icon: Quote, group: "block", markdown: ">", keywords: ["blockquote", "citation"], convertible: true },
  { id: "callout", label: "Callout", icon: MessageSquareText, group: "block", keywords: ["note", "tip", "warning", "info", "alert"], convertible: true },
  { id: "codeBlock", label: "Code", icon: Code, group: "block", markdown: "```", keywords: ["snippet", "pre", "monospace"], convertible: true },
  { id: "divider", label: "Divider", icon: Minus, group: "block", markdown: "---", keywords: ["hr", "line", "separator", "rule"], convertible: false },
];

const BLOCK_TYPE_BY_ID = new Map(BLOCK_TYPES.map((type) => [type.id, type]));

export function getBlockType(id: BlockTypeId): BlockType {
  return BLOCK_TYPE_BY_ID.get(id) ?? BLOCK_TYPES[0];
}

export const CONVERTIBLE_BLOCK_TYPES = BLOCK_TYPES.filter((type) => type.convertible);

/** Ranks block types for a typed query: label starts first, then keywords, then anything containing it. */
export function filterBlockTypes(query: string, types: readonly BlockType[] = BLOCK_TYPES): BlockType[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...types];

  const scored = types.flatMap((type) => {
    const label = type.label.toLowerCase();
    const words = label.split(/\s+/);
    let score = -1;
    if (label.startsWith(needle) || type.markdown === needle) score = 3;
    else if (words.some((word) => word.startsWith(needle)) || type.keywords.some((keyword) => keyword.startsWith(needle))) score = 2;
    else if (label.includes(needle) || type.keywords.some((keyword) => keyword.includes(needle))) score = 1;
    return score < 0 ? [] : [{ type, score }];
  });

  return scored.sort((a, b) => b.score - a.score).map(({ type }) => type);
}
