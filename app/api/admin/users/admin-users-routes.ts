const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The admin-user routes the browser may reach through the Next.js proxy.
 *
 * Only what the admin console calls is forwarded. Role grants and revocations
 * exist upstream but have no UI yet, so they are not reachable from the
 * browser at all. Authorization itself is enforced upstream; this narrows the
 * surface the web origin exposes.
 */
export function isAllowedAdminUsersRoute(method: string, path: readonly string[]): boolean {
  if (method === "GET") {
    if (path.length === 0) return true;
    if (path.length === 1) return path[0] === "statistics" || UUID_PATTERN.test(path[0]);
    return path.length === 2 && UUID_PATTERN.test(path[0]) && path[1] === "moderation-events";
  }
  if (method === "POST") {
    return path.length === 2 && UUID_PATTERN.test(path[0])
      && (path[1] === "suspend" || path[1] === "reactivate");
  }
  return false;
}
