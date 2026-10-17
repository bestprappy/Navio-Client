import { z } from "zod";

import { PALETTE_COLOR_ID_PATTERN, isVisibleOnBothThemes, paletteQueryKey } from "@/lib/palette/palette-colors";

import { AdminApiError } from "../admin-api";

export const adminPaletteColorSchema = z.object({
  id: z.string().regex(PALETTE_COLOR_ID_PATTERN),
  name: z.string(),
  hex: z.string().regex(/^#[0-9a-f]{6}$/i).transform((hex) => hex.toLowerCase()),
  sortOrder: z.number().int(),
  retired: z.boolean(),
  retiredAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminPaletteColor = z.infer<typeof adminPaletteColorSchema>;

/** Mirrors the server's limits so most mistakes are caught before a request. */
export const MAX_ACTIVE_COLORS = 48;
export const newColorSchema = z.object({
  name: z.string().trim().min(1, "Name the color.").max(40, "Use 40 characters or fewer."),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, "Use a hex color such as #E8590C.")
    .refine(isVisibleOnBothThemes, "This color disappears on the light or dark background. Pick a less extreme shade."),
});
export type NewColor = z.infer<typeof newColorSchema>;

export const paletteAdminKeys = { root: ["admin", "palette-colors"] as const };
/** Both caches change together: the admin list and the palette every picker reads. */
export const paletteCacheKeys = [paletteAdminKeys.root, paletteQueryKey] as const;

async function request<T>(path: string, schema: z.ZodType<T>, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/palette-colors${path}`, {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error("[palette-api] request failed", { method, path, error });
    throw new AdminApiError(
      method === "GET" ? "Could not load the palette. Try again." : "Navio did not confirm the change. Reload the palette before trying again.",
      0,
    );
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = z.object({ message: z.string(), validationErrors: z.record(z.string(), z.string()).optional() }).safeParse(payload);
    throw new AdminApiError(
      response.status === 401 ? "Your session ended. Sign in again."
        : response.status === 403 ? "Only administrators can manage the color palette."
        : response.status >= 500 ? "The palette is unavailable. Reload before retrying a change."
        : error.success ? Object.values(error.data.validationErrors ?? {}).join(" ") || error.data.message
        : "Could not complete this palette request.",
      response.status,
    );
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error("[palette-api] unreadable response", { method, path, issues: parsed.error.issues });
    throw new AdminApiError("Navio returned an unreadable palette response. Reload before trying again.", 502);
  }
  return parsed.data;
}

export const listAdminPalette = () => request("", z.array(adminPaletteColorSchema));
export const addPaletteColor = (color: NewColor) => request("", adminPaletteColorSchema, "POST", { name: color.name.trim(), hex: color.hex.trim() });
export const retirePaletteColor = (id: string) => request(`/${encodeURIComponent(id)}/retire`, adminPaletteColorSchema, "POST");
export const restorePaletteColor = (id: string) => request(`/${encodeURIComponent(id)}/restore`, adminPaletteColorSchema, "POST");
