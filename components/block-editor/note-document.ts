/**
 * The block document a note is edited and rendered as.
 *
 * <p>Node and mark names match the editor's schema, so a document produced by
 * {@link parseNoteMarkdown} can be handed to the editor unchanged and the
 * editor's own JSON can be serialized back to markdown.
 */

export type NoteMark = { type: string; attrs?: Record<string, unknown> };

export type NoteNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NoteNode[];
  text?: string;
  marks?: NoteMark[];
};

/** A node as the editor reports it, where every field is optional. */
export type NoteNodeLike = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: readonly NoteNodeLike[];
  text?: string;
  marks?: readonly NoteMark[];
};

export const NOTE_COLORS = ["gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export const NOTE_COLOR_LABELS: Record<NoteColor, string> = {
  gray: "Gray",
  brown: "Brown",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
  pink: "Pink",
  red: "Red",
};

export const CALLOUT_TONES = ["note", "tip", "important", "warning", "caution"] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export const CALLOUT_TONE_LABELS: Record<CalloutTone, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

export const HEADING_LEVELS = [1, 2, 3, 4] as const;
export type HeadingLevel = (typeof HEADING_LEVELS)[number];

/** Headings sit inside a day inside the page, so they never outrank the page's own. */
export const HEADING_TAGS = { 1: "h4", 2: "h5", 3: "h6", 4: "h6" } as const satisfies Record<HeadingLevel, string>;

export function isNoteColor(value: unknown): value is NoteColor {
  return typeof value === "string" && (NOTE_COLORS as readonly string[]).includes(value);
}

export function isCalloutTone(value: unknown): value is CalloutTone {
  return typeof value === "string" && (CALLOUT_TONES as readonly string[]).includes(value);
}

export function toHeadingLevel(value: unknown): HeadingLevel {
  const level = typeof value === "number" ? Math.round(value) : 1;
  return Math.min(4, Math.max(1, level)) as HeadingLevel;
}

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Only web, mail and phone links survive; anything else (javascript:, data:…) is dropped. */
export function isSafeHref(href: unknown): boolean {
  if (typeof href !== "string" || href.trim() === "") return false;
  try {
    return SAFE_LINK_PROTOCOLS.has(new URL(href.trim()).protocol);
  } catch {
    return false;
  }
}

/** Adds https:// to a typed address like `example.com`; returns null when it still is not a safe link. */
export function normalizeHref(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isSafeHref(trimmed)) return trimmed;
  if (/^[^\s@/:]+@[^\s@/]+\.[^\s@/]+$/.test(trimmed)) return `mailto:${trimmed}`;
  const withScheme = `https://${trimmed.replace(/^\/+/, "")}`;
  return isSafeHref(withScheme) && /\.[a-z]{2,}/i.test(new URL(withScheme).hostname) ? withScheme : null;
}

export function emptyParagraph(): NoteNode {
  return { type: "paragraph" };
}

export function emptyNoteDocument(): NoteNode {
  return { type: "doc", content: [emptyParagraph()] };
}
