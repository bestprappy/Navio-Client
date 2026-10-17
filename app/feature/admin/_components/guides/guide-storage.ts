import { z } from "zod";

import { PALETTE_COLOR_ID_PATTERN } from "../../../../../lib/palette/palette-colors";
import type { TripBlockColorId } from "../../../planner/planId/_components/constants/types";
import { paragraphMarkdown } from "./data";
import { GUIDE_ICON_IDS, guidePlaceMarkdown, placeKey, placeListMarkdown, type Guide, type GuidePlace } from "./guide-model";

/**
 * Before guides were shared, each admin's guides lived in their own browser.
 * This reads what is still there so it can be uploaded once, validated: a
 * value edited by hand, or in an unknown shape, is ignored rather than
 * breaking the page. Guides saved in the first shape, where places lived
 * inside their lists, are moved into the document.
 *
 * <p>The schemas here also check what the guide API returns.
 */

export const GUIDE_STORAGE_KEY = "navio.admin.guides.v2";
export const LEGACY_GUIDE_STORAGE_KEY = "navio.admin.guides.v1";

/** A guide as it was saved in a browser: no server status, version or editor yet. */
export type LocalGuide = Omit<Guide, "status" | "version" | "publishedAt" | "updatedByName">;

/** Any palette id: administrators add colors, so the set is not known at build time. */
const colorId = z.string().regex(PALETTE_COLOR_ID_PATTERN).transform((value): TripBlockColorId => value);
const id = z.string().regex(/^[A-Za-z0-9_-]{1,255}$/);
const provider = z.enum(["GOOGLE", "MAPBOX"]);

export const categorySchema = z.object({ id, name: z.string(), iconId: z.enum(GUIDE_ICON_IDS), colorId });
export const listSchema = z.object({ id, categoryId: z.string() });
export const placeSchema = z.object({
  id: z.string().min(1),
  provider,
  providerPlaceId: z.string().min(1),
  name: z.string(),
  address: z.string(),
  lat: z.number().finite(),
  lng: z.number().finite(),
  // The API writes absent optional fields as null.
  primaryType: z.string().nullish().transform((value) => value ?? undefined),
  category: z.string().nullish().transform((value) => value ?? undefined),
  tags: z.array(z.string()).default([]),
});
export const destinationSchema = z.object({ provider, providerPlaceId: z.string().min(1), name: z.string(), lat: z.number().finite(), lng: z.number().finite() });

const guideFields = {
  id,
  name: z.string(),
  country: z.string(),
  countryCode: z.string().length(2).nullable(),
  destination: destinationSchema,
  description: z.string(),
  coverPlaceId: z.string(),
  categories: z.array(categorySchema),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
};

const guidesSchema = z.array(
  z.object({
    ...guideFields,
    lists: z.record(z.string(), listSchema),
    places: z.record(z.string(), placeSchema),
  }),
);

const legacyGuidesSchema = z.array(
  z.object({
    ...guideFields,
    lists: z.record(
      z.string(),
      z.object({
        id,
        categoryId: z.string(),
        places: z.array(placeSchema.extend({ blurb: z.string().default(""), description: z.string().optional() })),
      }),
    ),
  }),
);

type LegacyGuide = z.infer<typeof legacyGuidesSchema>[number];

/** Each list's places become cards under its header, their write-ups the text under each card. */
function migrateLegacyGuide(guide: LegacyGuide): LocalGuide {
  const places: Record<string, GuidePlace> = {};
  let body = guide.body;
  for (const list of Object.values(guide.lists)) {
    const blocks: string[] = [];
    for (const { blurb, description, ...place } of list.places) {
      const key = placeKey(place);
      if (!key) continue;
      places[key] = place;
      blocks.push(guidePlaceMarkdown(key));
      for (const text of [blurb, description ?? ""]) if (text.trim()) blocks.push(paragraphMarkdown(text.trim()));
    }
    const header = placeListMarkdown(list.id);
    if (blocks.length && body.includes(header)) body = body.replace(header, [header, ...blocks].join("\n\n"));
  }
  const lists = Object.fromEntries(Object.values(guide.lists).map((list) => [list.id, { id: list.id, categoryId: list.categoryId }]));
  return { ...guide, lists, places, body };
}

function readJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Guides saved in this browser are not valid JSON; ignoring them.", { component: "GuideStorage", operation: "readJson", error });
    return undefined;
  }
}

export function parseStoredGuides(raw: string | null): LocalGuide[] | null {
  if (raw === null) return null;
  const value = readJson(raw);
  if (value === undefined) return null;
  const result = guidesSchema.safeParse(value);
  if (result.success) return result.data;
  console.error("Guides saved in this browser have an unexpected shape; ignoring them.", {
    component: "GuideStorage",
    operation: "parseStoredGuides",
    issues: result.error.issues.slice(0, 3),
  });
  return null;
}

/** Guides saved in the first shape, moved into the current one; null when there are none or they are unreadable. */
export function parseLegacyGuides(raw: string | null): LocalGuide[] | null {
  if (raw === null) return null;
  const value = readJson(raw);
  const result = legacyGuidesSchema.safeParse(value);
  return result.success ? result.data.map(migrateLegacyGuide) : null;
}

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Guides still saved only in this browser, newest shape first. */
export function readBrowserGuides(): LocalGuide[] {
  return parseStoredGuides(readLocal(GUIDE_STORAGE_KEY)) ?? parseLegacyGuides(readLocal(LEGACY_GUIDE_STORAGE_KEY)) ?? [];
}

export function clearBrowserGuides(): void {
  try {
    window.localStorage.removeItem(GUIDE_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_GUIDE_STORAGE_KEY);
  } catch {
    // Storage is unavailable; there is nothing to clear.
  }
}
