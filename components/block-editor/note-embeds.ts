/**
 * Embeds are blocks a host page adds to the editor, such as a guide's place
 * list. Their content lives outside the note; the note only keeps the ids that
 * point to it.
 *
 * <p>In markdown an embed is one HTML line with string attributes:
 * `<div data-embed="placeList" data-list-id="visit"></div>`. Only an editor
 * that registers the embed understands it. Anywhere else the line stays
 * literal text, like any other unknown HTML.
 */

export type NoteEmbedCodec = {
  /** The editor node's name, also written as `data-embed`. */
  name: string;
  /** camelCase attribute names, written as `data-` kebab-case attributes. */
  attributes: readonly string[];
};

export type NoteEmbedNode = { type: string; attrs: Record<string, string> };

/** Editor node group every embed joins, so block commands can recognise one. */
export const EMBED_GROUP = "embed";

/** Embed attribute values are ids (Google place ids reach ~200 characters), never free text, so they need no escaping. */
const EMBED_VALUE = /^[A-Za-z0-9_-]{1,255}$/;
const EMBED_HTML = /^<div data-embed="([A-Za-z][A-Za-z0-9]*)"((?:\s+data-[a-z][a-z0-9-]*="[^"<>]*")*)\s*><\/div>$/;
const EMBED_ATTRIBUTE = /\s+data-([a-z][a-z0-9-]*)="([^"<>]*)"/g;

export function toEmbedDataName(attribute: string): string {
  return attribute.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function isEmbedValue(value: unknown): value is string {
  return typeof value === "string" && EMBED_VALUE.test(value);
}

/** The embed's markdown line, or null when an attribute is missing or not an id. */
export function serializeEmbed(codec: NoteEmbedCodec, attrs: Readonly<Record<string, unknown>>): string | null {
  let html = `<div data-embed="${codec.name}"`;
  for (const attribute of codec.attributes) {
    const value = attrs[attribute];
    if (!isEmbedValue(value)) return null;
    html += ` data-${toEmbedDataName(attribute)}="${value}"`;
  }
  return `${html}></div>`;
}

/** Reads an HTML block as one of the registered embeds, or null. */
export function parseEmbed(html: string, codecs: readonly NoteEmbedCodec[]): NoteEmbedNode | null {
  if (!codecs.length) return null;
  const match = EMBED_HTML.exec(html.trim());
  const codec = match ? codecs.find((candidate) => candidate.name === match[1]) : undefined;
  if (!match || !codec) return null;

  const found = new Map<string, string>();
  for (const [, key, value] of match[2].matchAll(EMBED_ATTRIBUTE)) found.set(key, value);

  const attrs: Record<string, string> = {};
  for (const attribute of codec.attributes) {
    const value = found.get(toEmbedDataName(attribute));
    if (!isEmbedValue(value)) return null;
    attrs[attribute] = value;
  }
  return { type: codec.name, attrs };
}
