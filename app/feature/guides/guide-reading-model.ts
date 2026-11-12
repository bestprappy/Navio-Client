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

/** Preserve authored prose, hide empty published sections, and number resolved places. */
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
  // Editor-created headings can exist before any content is written. Keep prose-only
  // sections, but do not publish their empty scaffolding or navigation anchors.
  const visible = blocks.filter(block => block.kind !== "text" ||
    block.markdown.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;|\u00a0/g, " ").trim().length > 0 ||
    /!\[[^\]]*\]\(|<(?:img|video|iframe)\b/i.test(block.markdown));
  return visible.filter((block, index) => {
    if (block.kind !== "section" || block.placeCount > 0) return true;
    for (let next = index + 1; next < visible.length && visible[next].kind !== "section"; next++) {
      if (visible[next].kind === "text") return true;
    }
    return false;
  });
}
