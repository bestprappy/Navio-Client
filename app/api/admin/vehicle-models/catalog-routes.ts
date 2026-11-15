export const CATALOG_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,119}$/;

export const CATALOG_IMAGE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isAllowedCatalogRoute(method: string, path: readonly string[]): boolean {
  if (path.length === 0) return method === "GET" || method === "POST";
  // Photo upload: POST /images. It is never a catalog id route.
  if (path.length === 1 && path[0] === "images") return method === "POST";
  if (!CATALOG_ID_PATTERN.test(path[0])) return false;
  if (path.length === 1) return method === "GET" || method === "PUT";
  return path.length === 2 && method === "POST" && (path[1] === "publish" || path[1] === "archive");
}
