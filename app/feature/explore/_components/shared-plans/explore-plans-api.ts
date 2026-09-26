import { z } from "zod";

/**
 * Plans real Navio travellers published and chose to list on Explore.
 *
 * <p>Mirrors `ExplorePlanSummary`. Every field is derived server-side from the
 * frozen, sanitised snapshot, so a card can never show more than the shared
 * page itself would.
 */
const stopKindSchema = z.enum(["place", "charger"]).catch("place");

export const explorePlanSchema = z.object({
  token: z.string().min(1),
  title: z.string().nullish(),
  authorName: z.string().trim().min(1).nullish().catch(null),
  destinationCity: z.string().nullish(),
  destinationCountry: z.string().nullish(),
  dayCount: z.number().int().nonnegative().catch(0),
  placeCount: z.number().int().nonnegative().catch(0),
  chargerCount: z.number().int().nonnegative().catch(0),
  // The server already allows only http(s); re-checked here because this value
  // lands in a CSS url() on a public page.
  coverImageUrl: z.url({ protocol: /^https?$/ }).nullish().catch(null),
  highlights: z.array(z.string()).catch([]),
  days: z.array(z.object({ stops: z.array(stopKindSchema).catch([]) })).catch([]),
  listedAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

export type ExplorePlan = z.infer<typeof explorePlanSchema>;
export type StopKind = z.infer<typeof stopKindSchema>;

const explorePlansPageSchema = z.object({
  // A single malformed card is dropped rather than failing the whole feed.
  content: z
    .array(z.unknown())
    .transform((items) =>
      items.flatMap((item) => {
        const parsed = explorePlanSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    ),
  number: z.number().int().nonnegative(),
  last: z.boolean(),
  totalElements: z.number().int().nonnegative(),
});

export type ExplorePlansPage = z.infer<typeof explorePlansPageSchema>;

export const EXPLORE_PAGE_SIZE = 12;

/** Shared with the planner's publish hooks, which invalidate it after listing changes. */
export const EXPLORE_SHARED_PLANS_QUERY_KEY = ["explore", "shared-plans"] as const;

export class ExplorePlansError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ExplorePlansError";
  }
}

export function parseExplorePlansPage(value: unknown): ExplorePlansPage {
  const parsed = explorePlansPageSchema.safeParse(value);
  if (!parsed.success) {
    throw new ExplorePlansError("Explore returned plans in an unexpected format.", 502);
  }
  return parsed.data;
}

/** Browser-side page fetch, through this origin's anonymous read-only proxy. */
export async function fetchExplorePlansPage(
  page: number,
  signal?: AbortSignal,
): Promise<ExplorePlansPage> {
  const params = new URLSearchParams({ page: String(page), size: String(EXPLORE_PAGE_SIZE) });
  const response = await fetch(`/api/shared-plans?${params}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new ExplorePlansError("Shared plans could not be loaded.", response.status);
  }
  return parseExplorePlansPage(await response.json());
}

/** The Explore reading page for a listed plan. */
export function explorePlanPath(token: string): string {
  return `/explore/shared/${encodeURIComponent(token)}`;
}

export function explorePlanDestination(plan: Pick<ExplorePlan, "destinationCity" | "destinationCountry">) {
  return [plan.destinationCity, plan.destinationCountry].filter(Boolean).join(", ");
}

/** Text the Explore search box and filter chips match against. */
export function explorePlanSearchText(plan: ExplorePlan): string {
  return [plan.title, plan.authorName, plan.destinationCity, plan.destinationCountry, ...plan.highlights]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
