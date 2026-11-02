import { PALETTE_COLOR_ID_PATTERN } from "@/lib/palette/palette-colors";

/** Only the routes the admin palette API serves: list, add, label colors, retire, restore and delete. */
export function isAllowedPaletteRoute(method: string, path: readonly string[]): boolean {
  if (path.length === 0) return method === "GET" || method === "POST";
  if (path.length === 1) return (method === "PATCH" || method === "DELETE") && PALETTE_COLOR_ID_PATTERN.test(path[0]);
  return path.length === 2 && method === "POST" && PALETTE_COLOR_ID_PATTERN.test(path[0])
    && (path[1] === "retire" || path[1] === "restore");
}
