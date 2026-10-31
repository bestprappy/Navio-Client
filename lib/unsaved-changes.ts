/**
 * Decides whether following a link would leave the current page, which is when
 * unsaved changes need a confirmation. Pure, so it can be tested without a DOM.
 */
export function leavesPage(
  link: { href: string; target?: string | null; download?: boolean },
  current: { href: string },
): boolean {
  if (link.download) return false;
  if (link.target && link.target !== "_self") return false;
  let next: URL;
  let here: URL;
  try {
    here = new URL(current.href);
    next = new URL(link.href, here);
  } catch {
    return false;
  }
  if (next.origin !== here.origin) return true;
  // Same page with only a different #fragment does not discard anything.
  return next.pathname !== here.pathname || next.search !== here.search;
}

export const UNSAVED_CHANGES_MESSAGE = "You have unsaved changes. Leave this page and discard them?";
