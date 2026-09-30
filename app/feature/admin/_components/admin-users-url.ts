import type { AdminUserSearch, UserStatus } from "./admin-api";

/**
 * The Users page keeps its search, filter, page and open account in the URL,
 * so a view can be refreshed, shared with another moderator, or navigated with
 * the back button.
 *
 *   /admin/users?q=jane&status=suspended&page=2&user=<id>
 *
 * `page` is 1-based in the URL for people and 0-based in the API.
 */
export type AdminUsersView = AdminUserSearch & {
  userId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TERM_LENGTH = 200;

const URL_STATUSES: readonly UserStatus[] = ["active", "suspended", "deleted"];

type ReadableParams = { get(name: string): string | null };

function readStatus(value: string | null): UserStatus | null {
  return URL_STATUSES.find((status) => status === value) ?? null;
}

export function readAdminUsersView(params: ReadableParams): AdminUsersView {
  const rawPage = params.get("page") ?? "";
  const pageNumber = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const userId = params.get("user");
  return {
    term: (params.get("q") ?? "").slice(0, MAX_TERM_LENGTH),
    status: readStatus(params.get("status")),
    page: Number.isSafeInteger(pageNumber) && pageNumber > 1 && pageNumber <= 2_147_483_647 ? pageNumber - 1 : 0,
    userId: userId && UUID_PATTERN.test(userId) ? userId : null,
  };
}

export function adminUsersHref(view: Partial<AdminUsersView>): string {
  const params = new URLSearchParams();
  const term = view.term?.trim();
  if (term) params.set("q", term);
  if (view.status) params.set("status", view.status);
  if (view.page && view.page > 0) params.set("page", String(view.page + 1));
  if (view.userId) params.set("user", view.userId);
  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export const STATUS_FILTERS: ReadonlyArray<{ value: UserStatus | null; label: string }> = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Banned" },
  { value: "deleted", label: "Deleted" },
];
