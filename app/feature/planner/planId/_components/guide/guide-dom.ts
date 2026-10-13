import { format, isValid, parseISO } from "date-fns";

export function guidePlaceElementId(placeId: string): string {
  return `guide-place-${placeId.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

export function guideBrowseButtonId(blockId: string): string {
  return `guide-browse-${blockId}`;
}

/** "Wed, Oct 14" for a day's ISO date, used on add buttons. */
export function formatGuideDayLabel(date: string | undefined): string {
  const parsed = date ? parseISO(date) : null;
  return parsed && isValid(parsed) ? format(parsed, "EEE, MMM d") : "this day";
}

/** Scrolls a guide card into view in the drawer after a map pin selects it. */
export function revealGuidePlaceCard(placeId: string) {
  window.requestAnimationFrame(() => {
    const card = document.getElementById(guidePlaceElementId(placeId));
    if (!card) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  });
}
