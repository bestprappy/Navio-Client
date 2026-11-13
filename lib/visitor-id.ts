/**
 * A random id that identifies one browser, not one account. Shared-plan views
 * are counted once per browser with it, whether the reader is signed in or not.
 * It is httpOnly and carries no personal data.
 */
export const VISITOR_COOKIE = "navio_vid";

/** One year: a returning browser keeps its id, so its view is not counted again. */
export const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVisitorId(value: string | undefined | null): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** Pages whose server render reads a shared plan and so counts a view. */
export function isSharedPlanPath(pathname: string): boolean {
  return pathname.startsWith("/explore/shared/") || pathname.startsWith("/share/plans/");
}
