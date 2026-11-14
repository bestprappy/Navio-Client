export type FeedbackCommentOrder = 'oldest' | 'newest';

export const FEEDBACK_COMMENT_ORDERS = [
  { value: 'oldest', label: 'Oldest' },
  { value: 'newest', label: 'Newest' },
] as const satisfies readonly { value: FeedbackCommentOrder; label: string }[];

/**
 * Root pages the section loads on its own so the chosen order covers the whole
 * discussion (20 per page). Larger discussions continue with "Load more".
 */
export const FEEDBACK_AUTO_LOADED_PAGES = 10;

type Ordered = { id: string; createdAt: string };

function time(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Orders root comments locally; the service always pages them newest first. */
export function orderFeedbackComments<T extends Ordered>(rows: readonly T[], order: FeedbackCommentOrder): T[] {
  const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
  const direction = order === 'oldest' ? 1 : -1;
  return unique.sort((a, b) => direction * (time(a.createdAt) - time(b.createdAt) || a.id.localeCompare(b.id)));
}

/** Text that starts a reply to a reply, so readers can see who is being answered. */
export function replyMention(authorName: string | null): string {
  const name = authorName?.trim();
  return name ? `@${name} ` : '';
}
