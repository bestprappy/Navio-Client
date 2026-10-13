import type { TripBlockColorId } from "../../../planner/planId/_components/constants/types";
import { isEmbedValue, serializeEmbed, type NoteEmbedCodec } from "../../../../../components/block-editor/note-embeds";

/**
 * A curated destination guide as the admin writes it: a cover, a title, a
 * description, categories, and a block document.
 *
 * <p>The document is the source of order. A list header block starts a
 * section in a category; the place cards after it belong to that section and
 * are numbered in reading order until the next header. Text written between
 * cards is ordinary note text. Persistence is handled by the guide API.
 */

export const GUIDE_ICON_IDS = [
  "landmark",
  "utensils",
  "bed",
  "coffee",
  "wine",
  "shopping",
  "trees",
  "waves",
  "mountain",
  "camera",
  "ticket",
  "music",
  "train",
  "charging",
  "baby",
  "heart",
] as const;
export type GuideIconId = (typeof GUIDE_ICON_IDS)[number];

export type GuideCategory = {
  id: string;
  name: string;
  iconId: GuideIconId;
  colorId: TripBlockColorId;
};

/** Name, address and coordinates identify a place; its photo, rating and hours always load live. */
export type GuidePlace = {
  /** `PROVIDER:providerPlaceId`, as the place-detail lookup takes it. */
  id: string;
  provider: "GOOGLE" | "MAPBOX";
  providerPlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  primaryType?: string;
  category?: string;
  /** Short labels travelers see on the card, such as "Temple" or "Weekend only". */
  tags: readonly string[];
};

/** A list header in the document: the section's category. */
export type GuideList = {
  id: string;
  categoryId: string;
};

export type GuideDestination = {
  provider: "GOOGLE" | "MAPBOX";
  providerPlaceId: string;
  name: string;
  lat: number;
  lng: number;
};

export type GuideStatus = "DRAFT" | "PUBLISHED";

export type Guide = {
  id: string;
  name: string;
  country: string;
  /** ISO 3166 alpha-2, for the flag; null when the country name is not recognised. */
  countryCode: string | null;
  destination: GuideDestination;
  description: string;
  /** The place whose live photo is the banner, as `PROVIDER:id`. */
  coverPlaceId: string;
  categories: readonly GuideCategory[];
  /** Every list header the document has used; one taken out of the text stays for undo. */
  lists: Readonly<Record<string, GuideList>>;
  /** Every place the document has used, by {@link placeKey}; one taken out of the text stays for undo. */
  places: Readonly<Record<string, GuidePlace>>;
  /** Block-editor markdown. */
  body: string;
  /** Only published guides reach travelers. */
  status: GuideStatus;
  /** The server's version; a save names the version it was based on, so two admins never overwrite each other. */
  version: number;
  publishedAt: string | null;
  /** Who saved it last, for "Edited by"; null for the seed or a deleted account. */
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------- blocks in the document

export const PLACE_LIST_EMBED: NoteEmbedCodec = { name: "placeList", attributes: ["listId"] };
export const GUIDE_PLACE_EMBED: NoteEmbedCodec = { name: "guidePlace", attributes: ["placeId"] };

/** The id a place card block stores; null when the provider id cannot be written into the document. */
export function placeKey(place: Pick<GuidePlace, "providerPlaceId">): string | null {
  return isEmbedValue(place.providerPlaceId) ? place.providerPlaceId : null;
}

export function placeListMarkdown(listId: string): string {
  return serializeEmbed(PLACE_LIST_EMBED, { listId }) ?? "";
}

export function guidePlaceMarkdown(key: string): string {
  return serializeEmbed(GUIDE_PLACE_EMBED, { placeId: key }) ?? "";
}

const BLOCK_LINE = /<div data-embed="(placeList|guidePlace)" data-(?:list|place)-id="([A-Za-z0-9_-]{1,255})"><\/div>/g;

export type GuideBodyPart =
  | { kind: "text"; markdown: string }
  | { kind: "list"; listId: string }
  | { kind: "card"; key: string };

/** Empty lines the editor keeps between blocks; they mean nothing at a part's edge. */
const EDGE_BREAKS = /^(?:<br>\s*)+|(?:\s*<br>)+$/g;

/** The body as reading-order parts: list headers, place cards, and the text between them. */
export function splitGuideBody(body: string): GuideBodyPart[] {
  const parts: GuideBodyPart[] = [];
  const pushText = (markdown: string) => {
    const trimmed = markdown.trim().replace(EDGE_BREAKS, "").trim();
    if (trimmed) parts.push({ kind: "text", markdown: trimmed });
  };
  let cursor = 0;
  for (const match of body.matchAll(BLOCK_LINE)) {
    pushText(body.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    parts.push(match[1] === "placeList" ? { kind: "list", listId: match[2] } : { kind: "card", key: match[2] });
  }
  pushText(body.slice(cursor));
  return parts;
}

export type OutlinePlace = { key: string; place: GuidePlace; number: number };

export type OutlineSection = {
  /** Null for cards placed above the first list header. */
  listId: string | null;
  categoryId: string | null;
  places: OutlinePlace[];
};

/** The sections and numbered places a reader sees, in document order. */
export function guideOutline(guide: Pick<Guide, "body" | "lists" | "places">): OutlineSection[] {
  const sections: OutlineSection[] = [];
  let current: OutlineSection | null = null;
  for (const part of splitGuideBody(guide.body)) {
    if (part.kind === "text") continue;
    if (part.kind === "list") {
      current = { listId: part.listId, categoryId: guide.lists[part.listId]?.categoryId ?? null, places: [] };
      sections.push(current);
      continue;
    }
    const place = guide.places[part.key];
    if (!place) continue;
    if (!current) {
      current = { listId: null, categoryId: null, places: [] };
      sections.push(current);
    }
    current.places.push({ key: part.key, place, number: current.places.length + 1 });
  }
  return sections;
}

export function countGuidePlaces(guide: Pick<Guide, "body" | "lists" | "places">): number {
  return guideOutline(guide).reduce((total, section) => total + section.places.length, 0);
}

/** Where a card sits: its section and number. The first occurrence wins if a place is in the text twice. */
export function findOutlinePlace(sections: readonly OutlineSection[], key: string): { section: OutlineSection; entry: OutlinePlace } | null {
  for (const section of sections) {
    const entry = section.places.find((candidate) => candidate.key === key);
    if (entry) return { section, entry };
  }
  return null;
}

/** The list a card sits under, including a card with no place yet; null above the first list or when absent. */
export function listIdOfCard(guide: Pick<Guide, "body">, cardKey: string): string | null {
  let listId: string | null = null;
  for (const [, type, id] of guide.body.matchAll(BLOCK_LINE)) {
    if (type === "placeList") listId = id;
    else if (id === cardKey) return listId;
  }
  return null;
}

export function sectionHasPlace(sections: readonly OutlineSection[], listId: string, key: string): boolean {
  return sections.some((section) => section.listId === listId && section.places.some((entry) => entry.key === key));
}

// ---------------------------------------------------------------- countries

let countryCodesByName: Map<string, string> | null = null;

function normalizeName(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase();
}

/** ISO code for an English country name, such as "Thailand" -> "TH"; null when unknown. */
export function countryCodeFromName(name: string): string | null {
  if (!countryCodesByName) {
    countryCodesByName = new Map();
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    for (let first = 65; first <= 90; first += 1) {
      for (let second = 65; second <= 90; second += 1) {
        const code = String.fromCharCode(first, second);
        const label = names.of(code);
        if (label && label !== code) countryCodesByName.set(normalizeName(label), code);
      }
    }
  }
  return countryCodesByName.get(normalizeName(name)) ?? null;
}

/** The country in a place suggestion's secondary text: "Bangkok, Thailand" -> "Thailand". */
export function countryFromSecondaryText(secondaryText: string): string {
  const parts = secondaryText.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? "";
}

type CountryGuide = Pick<Guide, "name" | "country" | "countryCode">;

export type CountryGroup<T extends CountryGuide = Guide> = {
  country: string;
  countryCode: string | null;
  guides: readonly T[];
};

const UNKNOWN_COUNTRY = "Other places";

/** Guides grouped by country, countries and guides in alphabetical order. */
export function groupGuidesByCountry<T extends CountryGuide>(guides: readonly T[]): CountryGroup<T>[] {
  const groups = new Map<string, { country: string; countryCode: string | null; guides: T[] }>();
  for (const guide of guides) {
    const country = guide.country.trim() || UNKNOWN_COUNTRY;
    const key = normalizeName(country);
    const group = groups.get(key) ?? { country, countryCode: guide.countryCode, guides: [] };
    group.guides.push(guide);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, guides: [...group.guides].sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

/** Guides whose name or country contains the query; all guides for an empty query. */
export function filterGuides<T extends CountryGuide>(guides: readonly T[], query: string): readonly T[] {
  const needle = normalizeName(query);
  if (!needle) return guides;
  return guides.filter((guide) => normalizeName(guide.name).includes(needle) || normalizeName(guide.country).includes(needle));
}

export function findGuideForDestination(guides: readonly Guide[], providerPlaceId: string): Guide | null {
  return guides.find((guide) => guide.destination.providerPlaceId === providerPlaceId) ?? null;
}

// ---------------------------------------------------------------- creating

/** The three categories every new guide starts with. */
export const DEFAULT_CATEGORIES: readonly GuideCategory[] = [
  { id: "visit", name: "Places to visit", iconId: "landmark", colorId: "blue" },
  { id: "eat", name: "Places to eat", iconId: "utensils", colorId: "rose" },
  { id: "stay", name: "Places to stay", iconId: "bed", colorId: "violet" },
];

type NewGuideInput = {
  id: string;
  destination: GuideDestination;
  country: string;
  now: string;
};

/** A new guide with an empty section per default category, ready to fill in. */
export function createGuide({ id, destination, country, now }: NewGuideInput): Guide {
  const resolvedCountry = country.trim() || (countryCodeFromName(destination.name) ? destination.name.trim() : "");
  return {
    id,
    name: destination.name,
    country: resolvedCountry,
    countryCode: countryCodeFromName(resolvedCountry),
    destination,
    description: "",
    coverPlaceId: `${destination.provider}:${destination.providerPlaceId}`,
    categories: DEFAULT_CATEGORIES,
    lists: Object.fromEntries(DEFAULT_CATEGORIES.map((category) => [category.id, { id: category.id, categoryId: category.id }])),
    places: {},
    body: DEFAULT_CATEGORIES.map((category) => placeListMarkdown(category.id)).join("\n\n"),
    status: "DRAFT",
    version: 0,
    publishedAt: null,
    updatedByName: null,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------- categories

export function findCategory(guide: Pick<Guide, "categories">, categoryId: string | null): GuideCategory | null {
  return guide.categories.find((category) => category.id === categoryId) ?? null;
}

/** How many list headers in the text use the category. */
export function categoryUseCount(guide: Pick<Guide, "body" | "lists" | "places">, categoryId: string): number {
  return guideOutline(guide).filter((section) => section.categoryId === categoryId).length;
}

/** The category a new list should start with: the first one no list uses yet, else the first. */
export function categoryForNewList(guide: Pick<Guide, "body" | "lists" | "places" | "categories">): GuideCategory | null {
  return guide.categories.find((category) => categoryUseCount(guide, category.id) === 0) ?? guide.categories[0] ?? null;
}

export function upsertCategory(guide: Guide, category: GuideCategory): Guide {
  const exists = guide.categories.some((entry) => entry.id === category.id);
  return {
    ...guide,
    categories: exists
      ? guide.categories.map((entry) => (entry.id === category.id ? category : entry))
      : [...guide.categories, category],
  };
}

/** Removes a category no list in the text uses. A category in use stays, so no list loses its heading. */
export function removeCategory(guide: Guide, categoryId: string): Guide {
  if (categoryUseCount(guide, categoryId) > 0) return guide;
  return { ...guide, categories: guide.categories.filter((category) => category.id !== categoryId),
    lists: Object.fromEntries(Object.entries(guide.lists).filter(([, list]) => list.categoryId !== categoryId)) };
}

// ---------------------------------------------------------------- lists and places

/** Creates the header a new list block points to; an existing one is left alone. */
export function ensureList(guide: Guide, listId: string, categoryId: string): Guide {
  if (guide.lists[listId]) return guide;
  return { ...guide, lists: { ...guide.lists, [listId]: { id: listId, categoryId } } };
}

export function setListCategory(guide: Guide, listId: string, categoryId: string): Guide {
  const list = guide.lists[listId];
  if (!list || list.categoryId === categoryId || !findCategory(guide, categoryId)) return guide;
  return { ...guide, lists: { ...guide.lists, [listId]: { ...list, categoryId } } };
}

/** Keeps a place's details so a card in the text can show it. */
export function rememberPlace(guide: Guide, place: GuidePlace): Guide {
  const key = placeKey(place);
  if (!key || guide.places[key]) return guide;
  return { ...guide, places: { ...guide.places, [key]: place } };
}

type SearchResultPlace = Omit<GuidePlace, "tags">;

/** A searched place as a guide entry. Provider photos, ratings and hours are not kept. */
export function placeFromSearchResult(result: SearchResultPlace): GuidePlace {
  return {
    id: result.id,
    provider: result.provider,
    providerPlaceId: result.providerPlaceId,
    name: result.name,
    address: result.address,
    lat: result.lat,
    lng: result.lng,
    ...(result.primaryType ? { primaryType: result.primaryType } : {}),
    ...(result.category ? { category: result.category } : {}),
    tags: [],
  };
}

export const MAX_PLACE_TAGS = 6;
export const MAX_TAG_LENGTH = 24;

/** Adds a tag to a place; blank, repeated (ignoring case) and extra tags are refused. */
export function addPlaceTag(guide: Guide, key: string, tag: string): Guide {
  const place = guide.places[key];
  const label = tag.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
  if (!place || !label || place.tags.length >= MAX_PLACE_TAGS) return guide;
  if (place.tags.some((existing) => existing.toLocaleLowerCase() === label.toLocaleLowerCase())) return guide;
  return { ...guide, places: { ...guide.places, [key]: { ...place, tags: [...place.tags, label] } } };
}

export function removePlaceTag(guide: Guide, key: string, tag: string): Guide {
  const place = guide.places[key];
  if (!place || !place.tags.includes(tag)) return guide;
  return { ...guide, places: { ...guide.places, [key]: { ...place, tags: place.tags.filter((existing) => existing !== tag) } } };
}
