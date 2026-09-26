export const CATALOG_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,119}$/;

export function isAllowedCatalogRoute(method: string, path: readonly string[]): boolean {
  if (path.length === 0) return method === "GET" || method === "POST";
  if (!CATALOG_ID_PATTERN.test(path[0])) return false;
  if (path.length === 1) return method === "GET" || method === "PUT";
  return path.length === 2 && method === "POST" && (path[1] === "publish" || path[1] === "archive");
}
