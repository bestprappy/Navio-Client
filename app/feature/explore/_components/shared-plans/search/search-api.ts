import { z } from "zod";
import { explorePlanSchema, ExplorePlansError } from "../explore-plans-api";
import { durationDays, type PlanSearchState } from "./search-state";
export const planSearchPageSchema = z.object({
 querySuggestions:z.array(z.object({text:z.string(),source:z.enum(["catalogue","vocabulary"])})).optional(), notice:z.string().nullable().optional(),
 content: z.array(explorePlanSchema), recommendations: z.array(explorePlanSchema),
 destinations: z.array(z.object({ id: z.string(), label: z.string(), country: z.string(), kind: z.enum(["city","country"]), count: z.number().nonnegative() })),
 plans: z.array(explorePlanSchema), number: z.number().int().nonnegative(), last: z.boolean(),
 totalElements: z.number().int().nonnegative(), matchedCount: z.number().int().nonnegative(),
 matching: z.array(explorePlanSchema).optional(), related: z.array(explorePlanSchema).optional(),
 matchingTotal: z.number().int().nonnegative().optional(), relatedTotal: z.number().int().nonnegative().optional(),
 matchingLast: z.boolean().optional(), relatedLast: z.boolean().optional(),
 relatedPlans: z.array(explorePlanSchema).optional(), reasons: z.record(z.string(), z.string()).optional(), correction: z.string().nullable().optional(),
});
export type PlanSearchPage = z.infer<typeof planSearchPageSchema>;
export type PlanDestinationSuggestion = PlanSearchPage["destinations"][number];
export async function fetchPlanSearch(state: PlanSearchState, page: number, signal?: AbortSignal): Promise<PlanSearchPage> {
 const params=new URLSearchParams({term:state.query.trim(),country:state.country,page:String(page),size:"12",sort:state.sort});
 const days=durationDays(state.duration,state.unit);if(days!==null) params.set("days",String(days));
 const response=await fetch(`/api/shared-plans/search?${params}`,{signal,cache:"no-store",headers:{Accept:"application/json"}});
 if(!response.ok) throw new ExplorePlansError(response.status===503?"Plan search is not available on this server yet.":"Shared plans could not be searched. Please try again.",response.status);
 const parsed=planSearchPageSchema.safeParse(await response.json());
 if(!parsed.success) throw new ExplorePlansError("Search returned an unexpected response.",502);
 return parsed.data;
}
