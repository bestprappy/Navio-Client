import { z } from "zod";

import type { Guide, GuideCategory, GuideDestination } from "./guide-model";
import { categorySchema, destinationSchema, listSchema, placeSchema, type LocalGuide } from "./guide-storage";

/**
 * The guide service, through the Next.js API proxy. Every administrator sees
 * and edits every guide; each save names the version it started from, so a
 * second admin's save is refused instead of overwriting the first.
 */

const contentSchema = z.object({
  categories: z.array(categorySchema),
  lists: z.record(z.string(), listSchema),
  places: z.record(z.string(), placeSchema),
  body: z.string(),
});

const fieldsSchema = z.object({
  name: z.string(),
  country: z.string(),
  countryCode: z.string().length(2).nullable(),
  destination: destinationSchema,
  description: z.string(),
  coverPlaceId: z.string(),
  content: contentSchema,
});

const statusSchema = z.enum(["DRAFT", "PUBLISHED"]);

const adminGuideSchema = z.object({
  id: z.string(),
  status: statusSchema,
  version: z.number().int().nonnegative(),
  guide: fieldsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
  createdByName: z.string().nullable(),
  updatedByName: z.string().nullable(),
});

const summarySchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string().nullable(),
  coverPlaceId: z.string(),
  destinationProvider: z.string(),
  destinationPlaceId: z.string(),
  status: statusSchema,
  version: z.number().int().nonnegative(),
  placeCount: z.number().int().nonnegative(),
  categories: z.array(categorySchema),
  updatedAt: z.string(),
  updatedByName: z.string().nullable(),
  publishedAt: z.string().nullable(),
});

const publicGuideSchema = z.object({ id: z.string(), guide: fieldsSchema, publishedAt: z.string().nullable(), updatedAt: z.string() });

const pageOf = <T extends z.ZodType>(item: T) => z.object({ content: z.array(item), totalElements: z.number(), totalPages: z.number(), number: z.number() });

export type GuideSummary = z.infer<typeof summarySchema> & { categories: GuideCategory[] };
type GuideFields = z.infer<typeof fieldsSchema>;

export const guideKeys = {
  all: ["admin", "guides"] as const,
  list: ["admin", "guides", "list"] as const,
  detail: (id: string) => ["admin", "guides", "detail", id] as const,
  published: ["guides", "published"] as const,
};

export type GuideApiErrorKind = "conflict" | "notFound" | "session" | "forbidden" | "invalid" | "unavailable" | "network";

export class GuideApiError extends Error {
  constructor(message: string, readonly status: number, readonly kind: GuideApiErrorKind) {
    super(message);
    this.name = "GuideApiError";
  }
}

const errorSchema = z.object({ message: z.string(), validationErrors: z.record(z.string(), z.string()).nullish() });

function failure(status: number, payload: unknown, fallback: string): GuideApiError {
  const error = errorSchema.safeParse(payload);
  const message = error.success ? error.data.message : fallback;
  if (status === 409) return new GuideApiError(message, status, "conflict");
  if (status === 404) return new GuideApiError("This guide no longer exists. Another admin may have deleted it.", status, "notFound");
  if (status === 401) return new GuideApiError("Your session ended. Sign in again to keep editing.", status, "session");
  if (status === 403) return new GuideApiError("Only administrators can manage guides.", status, "forbidden");
  if (status >= 500) return new GuideApiError("The guide service is unavailable. Your changes are kept here; try again shortly.", status, "unavailable");
  const fields = error.success ? Object.values(error.data.validationErrors ?? {}).join(" ") : "";
  return new GuideApiError(fields || message, status, "invalid");
}

async function request<T>(url: string, schema: z.ZodType<T> | null, init: RequestInit & { body?: string } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      signal: AbortSignal.timeout(20_000),
      ...init,
    });
  } catch (error) {
    console.error("Guide request failed before reaching Navio.", { component: "GuidesApi", url, method: init.method ?? "GET", error });
    throw new GuideApiError("Navio could not be reached. Check your connection; your changes are kept here.", 0, "network");
  }
  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw failure(response.status, payload, "Navio could not complete this guide request.");
  if (!schema) return undefined as T;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error("Guide response has an unexpected shape.", { component: "GuidesApi", url, issues: parsed.error.issues.slice(0, 3) });
    throw new GuideApiError("Navio returned a guide this page cannot read. Reload and try again.", 502, "invalid");
  }
  return parsed.data;
}

// ------------------------------------------------------------ mapping

type AdminGuide = z.infer<typeof adminGuideSchema>;

function fromFields(id: string, fields: GuideFields): Omit<Guide, "status" | "version" | "publishedAt" | "updatedByName" | "createdAt" | "updatedAt"> {
  const { content, ...rest } = fields;
  return { id, ...rest, destination: rest.destination as GuideDestination, ...content };
}

export function guideFromAdmin(response: AdminGuide): Guide {
  return {
    ...fromFields(response.id, response.guide),
    status: response.status,
    version: response.version,
    publishedAt: response.publishedAt,
    updatedByName: response.updatedByName,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

/** What the service stores: everything the admin wrote, none of the server's own fields. */
export function guideFields(guide: Pick<Guide, "name" | "country" | "countryCode" | "destination" | "description" | "coverPlaceId" | "categories" | "lists" | "places" | "body">): GuideFields {
  return {
    name: guide.name,
    country: guide.country,
    countryCode: guide.countryCode,
    destination: guide.destination,
    description: guide.description,
    coverPlaceId: guide.coverPlaceId,
    content: { categories: [...guide.categories], lists: { ...guide.lists }, places: Object.fromEntries(Object.entries(guide.places).map(([key, place]) => [key, { ...place, primaryType: place.primaryType, category: place.category, tags: [...place.tags] }])), body: guide.body },
  };
}

// ------------------------------------------------------------ admin

const ADMIN = "/api/admin/guides";

export async function listGuides(): Promise<GuideSummary[]> {
  return allPages(ADMIN, summarySchema);
}

async function allPages<T>(url: string, schema: z.ZodType<T>): Promise<T[]> {
  const items: T[] = [];
  for (let number = 0; ; number++) {
    const page = await request(`${url}?size=100&page=${number}`, pageOf(schema));
    items.push(...page.content);
    if (number + 1 >= page.totalPages) return items;
  }
}

export const getGuide = async (id: string) => guideFromAdmin(await request(`${ADMIN}/${encodeURIComponent(id)}`, adminGuideSchema));

export const createGuide = async (guide: LocalGuide | Guide) =>
  guideFromAdmin(await request(ADMIN, adminGuideSchema, { method: "POST", body: JSON.stringify({ guide: guideFields(guide) }) }));

export const saveGuide = async (guide: Guide) =>
  guideFromAdmin(
    await request(`${ADMIN}/${encodeURIComponent(guide.id)}`, adminGuideSchema, {
      method: "PUT",
      body: JSON.stringify({ expectedVersion: guide.version, guide: guideFields(guide) }),
    }),
  );

export const setGuidePublished = async (guide: Pick<Guide, "id" | "version">, published: boolean) =>
  guideFromAdmin(
    await request(`${ADMIN}/${encodeURIComponent(guide.id)}/${published ? "publish" : "unpublish"}`, adminGuideSchema, {
      method: "POST",
      body: JSON.stringify({ expectedVersion: guide.version }),
    }),
  );

export const deleteGuide = (guide: Pick<Guide, "id" | "version">) =>
  request<void>(`${ADMIN}/${encodeURIComponent(guide.id)}?expectedVersion=${guide.version}`, null, { method: "DELETE" });

// ------------------------------------------------------------ travelers

/** Every published guide; there are few enough to match a trip's days locally. */
export async function listPublishedGuides(): Promise<Guide[]> {
  const guides = await allPages("/api/guides", publicGuideSchema);
  return guides.map((entry) => ({
    ...fromFields(entry.id, entry.guide),
    status: "PUBLISHED",
    version: 0,
    publishedAt: entry.publishedAt,
    updatedByName: null,
    createdAt: entry.publishedAt ?? entry.updatedAt,
    updatedAt: entry.updatedAt,
  }));
}
