import { z } from "zod";

export const CONNECTORS = ["CCS1", "CCS2", "TYPE2", "J1772", "CHADEMO", "NACS", "GB_T"] as const;
export const CATALOG_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const BATTERY_BASES = ["MANUFACTURER_DECLARED", "USABLE", "GROSS", "UNKNOWN"] as const;
export const RANGE_STANDARDS = ["NEDC", "WLTP", "EPA", "CLTC"] as const;
export const catalogFieldsSchema = z.object({
  make: z.string().trim().min(1, "Enter the make.").max(100), model: z.string().trim().min(1, "Enter the model.").max(100),
  trim: z.string().trim().max(100), year: z.number().int().min(1900).max(2200).nullable(),
  market: z.string().regex(/^[A-Z]{2}$/, "Use a two-letter market code, such as TH."),
  batteryCapacityKwh: z.number().positive().max(999999.99).nullable(), batteryCapacityBasis: z.enum(BATTERY_BASES),
  rangeKm: z.number().positive().max(999999.99).nullable(), rangeStandard: z.enum(RANGE_STANDARDS).nullable(),
  connectorTypes: z.array(z.enum(CONNECTORS)).max(7),
  maxAcKw: z.number().min(0).max(1000).nullable(), maxDcKw: z.number().min(0).max(2000).nullable(),
  imageUrl: z.string().max(2048).nullable(), sourceUrl: z.string().max(2048).nullable(), verifiedAt: z.iso.date().nullable(),
});
export const catalogEntrySchema = z.object({
  id: z.string(), status: z.enum(CATALOG_STATUSES), version: z.number().int().nonnegative(),
  specification: catalogFieldsSchema, createdAt: z.string(), updatedAt: z.string(),
});
const catalogPageSchema = z.object({ content: z.array(catalogEntrySchema), number: z.number(), totalElements: z.number(), totalPages: z.number() });
export type CatalogFields = z.infer<typeof catalogFieldsSchema>;
export type CatalogEntry = z.infer<typeof catalogEntrySchema>;
export type CatalogStatus = CatalogEntry["status"];
export const catalogKeys = { root: ["admin", "vehicle-models"] as const, public: ["vehicle-catalog"] as const };
export const EMPTY_CATALOG_FIELDS: CatalogFields = { make: "", model: "", trim: "", year: null, market: "TH", batteryCapacityKwh: null, batteryCapacityBasis: "UNKNOWN", rangeKm: null, rangeStandard: null, connectorTypes: [], maxAcKw: null, maxDcKw: null, imageUrl: null, sourceUrl: null, verifiedAt: null };

export class CatalogApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
async function request<T>(path: string, schema: z.ZodType<T>, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/vehicle-models${path}`, { method, cache: "no-store", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  } catch {
    throw new CatalogApiError(method === "GET" ? "Could not load the catalog. Try again." : "Navio did not confirm the change. Reload the saved vehicle before trying again.", 0);
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = z.object({ message: z.string(), validationErrors: z.record(z.string(), z.string()).optional() }).safeParse(payload);
    throw new CatalogApiError(response.status === 409 ? "This vehicle changed elsewhere, or another vehicle uses the same make, model, trim, year and market. Reload the saved version before trying again."
      : response.status === 401 ? "Your session ended. Sign in again."
      : response.status === 403 ? "Only administrators can manage the vehicle catalog."
      : response.status >= 500 ? "The catalog is unavailable. Reload the saved vehicle before retrying a change."
      : error.success ? Object.values(error.data.validationErrors ?? {}).join(" ") || error.data.message : "Could not complete this catalog request.", response.status);
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new CatalogApiError("Navio returned an unreadable catalog response. Reload before trying again.", 502);
  return parsed.data;
}
export function listAdminCatalog(term: string, status: CatalogStatus | null, page: number) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (term.trim()) params.set("term", term.trim());
  if (status) params.set("status", status);
  return request(`?${params}`, catalogPageSchema);
}
export const getAdminCatalogEntry = (id: string) => request(`/${encodeURIComponent(id)}`, catalogEntrySchema);
export const saveCatalogEntry = (entry: CatalogEntry | null, specification: CatalogFields) => request(entry ? `/${encodeURIComponent(entry.id)}` : "", catalogEntrySchema, entry ? "PUT" : "POST", { specification, expectedVersion: entry?.version ?? null });
export const transitionCatalogEntry = (entry: CatalogEntry, action: "publish" | "archive") => request(`/${encodeURIComponent(entry.id)}/${action}`, catalogEntrySchema, "POST", { expectedVersion: entry.version });
