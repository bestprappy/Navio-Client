import {
  findCategory,
  splitGuideBody,
  type Guide,
  type GuideCategory,
  type GuidePlace,
} from "../admin/_components/guides/guide-model";

export type ReadingBlock =
  | { kind: "text"; markdown: string }
  | { kind: "section"; id: string; category: GuideCategory | null; placeCount: number }
  | {
      kind: "place";
      place: GuidePlace;
      number: number;
      colorId: GuideCategory["colorId"];
    };

/** Preserve the authored text and empty sections, and number only resolved place cards. */
export function guideReadingBlocks(guide: Guide): ReadingBlock[] {
  let number = 0;
  let category: GuideCategory | null = null;
  const blocks = splitGuideBody(guide.body).flatMap<ReadingBlock>((part) => {
    if (part.kind === "text") return [part];
    if (part.kind === "list") {
      const list = guide.lists[part.listId];
      if (!list) return [];
      number = 0;
      category = findCategory(guide, list.categoryId);
      return [{ kind: "section", id: part.listId, category, placeCount: 0 }];
    }
    const place = guide.places[part.key];
    return place
      ? [
          {
            kind: "place",
            place,
            number: ++number,
            colorId: category?.colorId ?? "slate",
          },
        ]
      : [];
  });
  let section: Extract<ReadingBlock, { kind: "section" }> | null = null;
  for (const block of blocks) {
    if (block.kind === "section") section = block;
    else if (block.kind === "place" && section) section.placeCount++;
  }
  return blocks;
}
