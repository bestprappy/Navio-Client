/** Guide ids are UUIDs; anything else never reaches the service. */
export const GUIDE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The admin guide operations the proxy forwards: list, create, read, save, delete, publish and unpublish. */
export function isAllowedGuideRoute(method: string, path: readonly string[]): boolean {
  if (path.length === 0) return method === "GET" || method === "POST";
  if (!GUIDE_ID_PATTERN.test(path[0])) return false;
  if (path.length === 1) return method === "GET" || method === "PUT" || method === "DELETE";
  return path.length === 2 && method === "POST" && (path[1] === "publish" || path[1] === "unpublish");
}

/** Travelers may read published guides only: the list, or one guide by id. */
export function isAllowedPublicGuideRoute(method: string, path: readonly string[]): boolean {
  return method === "GET" && (path.length === 0 || (path.length === 1 && GUIDE_ID_PATTERN.test(path[0])));
}
