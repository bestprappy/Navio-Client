import { z } from "zod";
import {
  adminGuideSchema,
  fieldsSchema,
  fromFields,
  guideFields,
  guideFromAdmin,
  guideRequest,
  pageOf,
  summarySchema,
} from "../admin/_components/guides/guides-api";
import { categorySchema } from "../admin/_components/guides/guide-storage";
import type { GuideWorkspace } from "../admin/_components/guides/guide-workspace";

const MINE = "/api/users/me/guides";
const PUBLIC = "/api/traveler-guides";
export const travelerGuideKeys = ["traveler-guides"] as const;
const authorSchema = z.object({
  id: z.string().uuid().nullish(),
  displayName: z.string(),
  avatarMediaId: z.string().uuid().nullish(),
});
const publishedSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string().nullable(),
  destinationName: z.string(),
  destinationProvider: z.enum(["GOOGLE", "MAPBOX"]),
  destinationPlaceId: z.string(),
  description: z.string(),
  coverPlaceId: z.string(),
  placeCount: z.number().int().nonnegative(),
  categories: z.array(categorySchema),
  author: authorSchema,
  publishedAt: z.string(),
  updatedAt: z.string(),
});
const publishedDetailSchema = z.object({
  id: z.string().uuid(),
  guide: fieldsSchema,
  author: authorSchema,
  publishedAt: z.string(),
  updatedAt: z.string(),
});
export type PublishedGuideSummary = z.infer<typeof publishedSummarySchema>;
export type GuideDiscoveryFilter = {
  term?: string;
  cities?: readonly string[];
  country?: string;
  destinations?: readonly string[];
  size?: number;
};

export function guideSearchParams(
  filter: GuideDiscoveryFilter,
  page: number,
): URLSearchParams {
  const params = new URLSearchParams({
    page: String(page),
    size: String(filter.size ?? 12),
  });
  if (filter.term?.trim()) params.set("term", filter.term.trim());
  if (filter.country?.trim()) params.set("country", filter.country.trim());
  for (const city of filter.cities ?? []) params.append("city", city);
  for (const destination of filter.destinations ?? [])
    params.append("destination", destination);
  return params;
}

export const listYourGuides = (page = 0, term = "", size = 12) =>
  guideRequest(
    `${MINE}?${guideSearchParams({ term, size }, page)}`,
    pageOf(summarySchema),
  );
export const discoverGuides = (filter: GuideDiscoveryFilter, page = 0) =>
  guideRequest(
    `${PUBLIC}?${guideSearchParams(filter, page)}`,
    pageOf(publishedSummarySchema),
  );
export async function readTravelerGuide(id: string) {
  const entry = await guideRequest(
    `${PUBLIC}/${encodeURIComponent(id)}`,
    publishedDetailSchema,
  );
  return {
    guide: {
      ...fromFields(entry.id, entry.guide),
      status: "PUBLISHED" as const,
      version: 0,
      publishedAt: entry.publishedAt,
      updatedByName: null,
      createdAt: entry.publishedAt,
      updatedAt: entry.updatedAt,
    },
    author: entry.author,
  };
}

export function userGuideWorkspace(userId: string): GuideWorkspace {
  const all = ["user-guides", userId] as const;
  return {
    kind: "user",
    home: "/dashboard/guides",
    keys: {
      all,
      list: [...all, "list"],
      detail: (id) => [...all, "detail", id],
      published: travelerGuideKeys,
    },
    get: async (id) =>
      guideFromAdmin(
        await guideRequest(
          `${MINE}/${encodeURIComponent(id)}`,
          adminGuideSchema,
        ),
      ),
    create: async (guide) =>
      guideFromAdmin(
        await guideRequest(MINE, adminGuideSchema, {
          method: "POST",
          body: JSON.stringify({ guide: guideFields(guide) }),
        }),
      ),
    save: async (guide) =>
      guideFromAdmin(
        await guideRequest(
          `${MINE}/${encodeURIComponent(guide.id)}`,
          adminGuideSchema,
          {
            method: "PUT",
            body: JSON.stringify({
              expectedVersion: guide.version,
              guide: guideFields(guide),
            }),
          },
        ),
      ),
    publish: async (guide, published) =>
      guideFromAdmin(
        await guideRequest(
          `${MINE}/${encodeURIComponent(guide.id)}/${published ? "publish" : "unpublish"}`,
          adminGuideSchema,
          {
            method: "POST",
            body: JSON.stringify({ expectedVersion: guide.version }),
          },
        ),
      ),
    delete: (guide) =>
      guideRequest<void>(
        `${MINE}/${encodeURIComponent(guide.id)}?expectedVersion=${guide.version}`,
        null,
        { method: "DELETE" },
      ),
  };
}
