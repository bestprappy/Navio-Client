import { PALETTE_COLOR_ID_PATTERN } from "@/lib/palette/palette-colors";

/** Only the routes the admin palette API serves; there is no edit or delete. */
export function isAllowedPaletteRoute(method: string, path: readonly string[]): boolean {
  if (path.length === 0) return method === "GET" || method === "POST";
  return path.length === 2 && method === "POST" && PALETTE_COLOR_ID_PATTERN.test(path[0])
    && (path[1] === "retire" || path[1] === "restore");
}
