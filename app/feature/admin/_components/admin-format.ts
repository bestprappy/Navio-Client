import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

/** "12 Sep 2026", or the raw value if the server sent something unparseable. */
export function formatAdminDate(value: string): string {
  const date = parseISO(value);
  return isValid(date) ? format(date, "d MMM yyyy") : value;
}

/** "12 Sep 2026, 14:05" */
export function formatAdminDateTime(value: string): string {
  const date = parseISO(value);
  return isValid(date) ? format(date, "d MMM yyyy, HH:mm") : value;
}

/** "3 days ago" */
export function formatAdminRelative(value: string): string {
  const date = parseISO(value);
  return isValid(date) ? `${formatDistanceToNowStrict(date)} ago` : value;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}
