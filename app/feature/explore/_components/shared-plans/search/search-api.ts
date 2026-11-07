import { z } from "zod";
import { explorePlanSchema, ExplorePlansError } from "../explore-plans-api";
import { durationDays, type PlanSearchState } from "./search-state";
export const searchSuggestionSchema=z.object({text:z.string(),kind:z.enum(['rewrite','refine','broaden']),changedFacets:z.array(z.string()),availability:z.enum(['available','none','unknown']),label:z.string(),action:z.object({query:z.string()})});
export const searchAssistSchema=z.object({schemaVersion:z.literal(1),conceptVersion:z.string(),query:z.string(),country:z.string(),days:z.number().int().nullable(),sort:z.string(),fingerprint:z.string(),catalogueRevision:z.string(),maxQueryLength:z.number().int().min(100).max(256),interpretation:z.string(),notices:z.array(z.string()),suggestions:z.array(searchSuggestionSchema),blocked:z.boolean()});
export type SearchAssist=z.infer<typeof searchAssistSchema>;
export type SearchSuggestion=z.infer<typeof searchSuggestionSchema>;
export const planSearchPageSchema = z.object({
 discoveryLabels:z.record(z.string(),z.enum(['trending','popular','recent'])).optional(),
 searchAssist:searchAssistSchema.nullable().optional(),
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
export async function fetchPlanSearch(state: PlanSearchState, page: number, signal?: AbortSignal,catalogueRevision?:string,pageSize=12): Promise<PlanSearchPage> {
 const params=new URLSearchParams({term:state.query.trim(),country:state.country,page:String(page),size:String(pageSize),sort:state.sort});
 if(state.collections?.length)params.set('collections',state.collections.join(','));
 if(state.themes?.length)params.set('themes',state.themes.join(','));
 const days=durationDays(state.duration,state.unit);if(days!==null) params.set("days",String(days));
 if(page>0&&catalogueRevision)params.set('catalogueRevision',catalogueRevision);
 const response=await fetch(`/api/shared-plans/search?${params}`,{signal,cache:"no-store",headers:{Accept:"application/json"}});
 if(!response.ok) throw new ExplorePlansError(response.status===409?"The published plans changed. Refreshing your results.":response.status===503?"Plan search is not available on this server yet.":"Shared plans could not be searched. Please try again.",response.status);
 const parsed=planSearchPageSchema.safeParse(await response.json());
 if(!parsed.success) throw new ExplorePlansError("Search returned an unexpected response.",502);
 return parsed.data;
}
