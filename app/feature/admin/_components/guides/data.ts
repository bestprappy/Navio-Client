import { serializeNoteMarkdown } from "../../../../../components/block-editor/note-markdown";
import { BANGKOK_GUIDE } from "../../../planner/planId/_components/guide/data";
import {
  DEFAULT_CATEGORIES,
  guidePlaceMarkdown,
  placeKey,
  placeListMarkdown,
  type Guide,
  type GuidePlace,
} from "./guide-model";

/**
 * Mock guides until the guide service exists. Bangkok is built from the
 * planner's prototype guide, so both screens show the same places; each
 * place's write-up becomes the text under its card.
 */

const SEED_TIME = "2026-10-13T09:00:00.000Z";

/** Plain text as a markdown paragraph, escaped the way the editor writes it. */
export function paragraphMarkdown(text: string): string {
  return serializeNoteMarkdown({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
}

const SECTION_INTROS: Record<string, string> = {
  visit: "Plan around the heat: temples first thing in the morning, a long lunch somewhere air-conditioned, then markets and rooftops after dark.",
  eat: "Bangkok eats best at street level. The famous shophouses queue for an hour or more at dinner, so go mid-afternoon.",
  stay: "Stay by the river for the old town and the boat shuttles, or along the BTS for shopping and nightlife.",
};

const places: Record<string, GuidePlace> = {};
const body: string[] = [];

for (const section of BANGKOK_GUIDE.sections) {
  body.push(placeListMarkdown(section.id), paragraphMarkdown(SECTION_INTROS[section.id] ?? ""));
  for (const place of section.places) {
    const key = placeKey(place);
    if (!key) continue;
    places[key] = {
      id: place.id,
      provider: place.provider,
      providerPlaceId: place.providerPlaceId,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      primaryType: place.primaryType,
      category: place.category,
      tags: place.tags,
    };
    body.push(guidePlaceMarkdown(key), paragraphMarkdown(place.blurb));
  }
}

export const BANGKOK_ADMIN_GUIDE: Guide = {
  id: "bangkok",
  name: BANGKOK_GUIDE.name,
  country: BANGKOK_GUIDE.country,
  countryCode: "TH",
  destination: { provider: "GOOGLE", providerPlaceId: BANGKOK_GUIDE.destinationPlaceIds[0], name: "Bangkok", lat: 13.7563309, lng: 100.5017651 },
  description: BANGKOK_GUIDE.description,
  coverPlaceId: BANGKOK_GUIDE.coverPlaceId,
  categories: DEFAULT_CATEGORIES.map((category) => ({
    ...category,
    name: BANGKOK_GUIDE.sections.find((section) => section.id === category.id)?.title ?? category.name,
  })),
  lists: Object.fromEntries(BANGKOK_GUIDE.sections.map((section) => [section.id, { id: section.id, categoryId: section.id }])),
  places,
  body: body.join("\n\n"),
  status: "PUBLISHED",
  version: 0,
  publishedAt: SEED_TIME,
  updatedByName: null,
  createdAt: SEED_TIME,
  updatedAt: SEED_TIME,
};

export const SEED_GUIDES: readonly Guide[] = [BANGKOK_ADMIN_GUIDE];
