const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The admin-user routes the browser may reach through the Next.js proxy.
 *
 * Only routes used by the console are forwarded. OWNER is deliberately absent
 * from role mutations; it can only be assigned by a trusted Keycloak operator.
 */
export function isAllowedAdminUsersRoute(method: string, path: readonly string[]): boolean {
  if (method === "GET") {
    if (path.length === 0) return true;
    if (path.length === 1) return path[0] === "statistics" || UUID_PATTERN.test(path[0]);
    return path.length === 2 && UUID_PATTERN.test(path[0]) && path[1] === "moderation-events";
  }
  if (method === "POST") {
    if (path.length === 2 && UUID_PATTERN.test(path[0]) && path[1] === "roles") return true;
    return path.length === 2 && UUID_PATTERN.test(path[0])
      && (path[1] === "suspend" || path[1] === "reactivate");
  }
  if (method === "DELETE") {
    return path.length === 3 && UUID_PATTERN.test(path[0]) && path[1] === "roles"
      && (path[2] === "MODERATOR" || path[2] === "ADMIN");
  }
  return false;
}
