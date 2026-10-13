import { parseNoteMarkdown } from "../../../../../components/block-editor/note-markdown";
import type { NoteNode } from "../../../../../components/block-editor/note-document";
import type {
  DestinationGuide,
  GuideDocumentBlock,
  GuidePlace as PlannerGuidePlace,
  GuideSection,
} from "../../../planner/planId/_components/guide/destination-guide";
import { normalizeDestinationName } from "../../../planner/planId/_components/guide/destination-guide";
import { GUIDE_PLACE_EMBED, PLACE_LIST_EMBED, findCategory, guideOutline, splitGuideBody, type Guide } from "./guide-model";

/**
 * A written guide as travelers see it in the planner: each list becomes a
 * section, and the text written under a place's card becomes its write-up.
 * Lists with no places, and guides with none at all, are left out.
 */

const EMBEDS = [PLACE_LIST_EMBED, GUIDE_PLACE_EMBED];

/** The byline of every guide written in the admin console. */
export const NAVIO_TEAM = "Navio team";

function plainText(node: NoteNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";
  const children = (node.content ?? []).map(plainText);
  return node.type === "paragraph" || node.type === "heading" || node.type === "detailsSummary" ? children.join("") : children.filter(Boolean).join(" ");
}

/** The text between each card and the next block of the guide's own, by the card's key. */
export function textUnderCards(body: string): Map<string, string> {
  const notes = new Map<string, string[]>();
  let current: string | null = null;
  for (const node of parseNoteMarkdown(body, EMBEDS).content ?? []) {
    if (node.type === GUIDE_PLACE_EMBED.name) {
      current = typeof node.attrs?.placeId === "string" ? node.attrs.placeId : null;
      if (current && !notes.has(current)) notes.set(current, []);
    } else if (node.type === PLACE_LIST_EMBED.name) {
      current = null;
    } else if (current) {
      const text = plainText(node).replace(/\s+/g, " ").trim();
      if (text) notes.get(current)?.push(text);
    }
  }
  return new Map([...notes].map(([key, parts]) => [key, parts.join(" ")]));
}

export function toDestinationGuide(guide: Guide): DestinationGuide | null {
  const notes = textUnderCards(guide.body);
  /** Section ids by outline position; lists with no places have none. */
  const sectionIds = new Map<number, string>();
  const sections: GuideSection[] = guideOutline(guide).flatMap((section, index) => {
    const category = findCategory(guide, section.categoryId);
    if (!section.places.length) return [];
    const places: PlannerGuidePlace[] = section.places.map(({ key, place }) => ({
      id: place.id,
      provider: place.provider,
      providerPlaceId: place.providerPlaceId,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      primaryType: place.primaryType,
      category: place.category,
      description: place.category,
      blurb: notes.get(key) ?? "",
      tags: place.tags,
    }));
    const id = section.listId ?? `section-${index}`;
    sectionIds.set(index, id);
    return [
      {
        id,
        title: category?.name ?? "Places",
        colorId: category?.colorId ?? "slate",
        iconId: category?.iconId,
        places,
      },
    ];
  });
  if (!sections.length) return null;

  return {
    id: guide.id,
    name: guide.name,
    country: guide.country,
    description: guide.description,
    destinationPlaceIds: [guide.destination.providerPlaceId],
    aliases: [...new Set([guide.name, guide.destination.name].map(normalizeDestinationName).filter(Boolean))],
    coverPlaceId: guide.coverPlaceId,
    author: NAVIO_TEAM,
    sections,
    document: guideDocument(guide, sectionIds),
  };
}

/**
 * The guide in reading order, walked the way `guideOutline` numbers it: a list
 * header opens a section, and a card above every header opens an unnamed one.
 */
function guideDocument(guide: Guide, sectionIds: ReadonlyMap<number, string>): GuideDocumentBlock[] {
  const blocks: GuideDocumentBlock[] = [];
  let index = -1;
  let number = 0;
  for (const part of splitGuideBody(guide.body)) {
    if (part.kind === "text") {
      blocks.push(part);
      continue;
    }
    if (part.kind === "list") {
      index += 1;
      number = 0;
      const sectionId = sectionIds.get(index);
      if (sectionId) blocks.push({ kind: "section", sectionId });
      continue;
    }
    const place = guide.places[part.key];
    if (!place) continue;
    if (index < 0) index = 0;
    const sectionId = sectionIds.get(index);
    number += 1;
    if (sectionId) blocks.push({ kind: "place", sectionId, placeId: place.id, number });
  }
  return blocks;
}

const converted = new WeakMap<Guide, DestinationGuide | null>();

/** The same guide object always gives the same result, so planner views can memoise on it. */
export function toDestinationGuideCached(guide: Guide): DestinationGuide | null {
  if (!converted.has(guide)) converted.set(guide, toDestinationGuide(guide));
  return converted.get(guide) ?? null;
}
