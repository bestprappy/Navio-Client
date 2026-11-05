import { requestText } from "./search-draft";
import { countries } from "../../../places/search-state";
export type DurationUnit = "days" | "months" | "years";
export const planSorts=[['relevance','Recommended'],['recent','Newest shared'],['trending','Trending'],['popular','Most copied'],['views','Most viewed'],['rating','Highest rated'],['discussed','Most discussed']] as const;
export type PlanSearchSort = typeof planSorts[number][0];
const selected=(raw:string|null,allowed:readonly string[])=>allowed.filter(value=>(raw??'').split(',').includes(value));
export type PlanSearchState = { query: string; country: string; duration: string; unit: DurationUnit; sort: PlanSearchSort; collections?:string[]; themes?:string[] };
export const emptyPlanSearch: PlanSearchState = { query: "", country: "", duration: "", unit: "days", sort: "relevance",collections:[],themes:[] };
export function applyPlanFilters(current:PlanSearchState,draft:PlanSearchState):PlanSearchState{return {...current,sort:draft.sort,collections:draft.collections??[],themes:draft.themes??[]};}
const units: Record<DurationUnit, number> = { days: 1, months: 30, years: 365 };
export function durationDays(value: string, unit: DurationUnit): number | null {
 if (!/^\d+$/.test(value)) return null;
 const days = Number(value) * units[unit];
 return Number.isSafeInteger(days) && days >= 1 && days <= 36500 ? days : null;
}
export function parsePlanSearch(params: URLSearchParams): PlanSearchState {
 const country = (params.get("planCountry") || "").toUpperCase();
 const unit = params.get("planDurationUnit"); const sort = params.get("planSort");
 return { query: (params.get("planQuery") ?? (params.get("tab") !== "guides" && params.get("tab") !== "places" ? params.get("term") : "") ?? ""),
 country: countries.some(c => c.code === country) ? country : "", duration: (params.get("planDuration") || "").slice(0,8),
 unit: unit === "months" || unit === "years" ? unit : "days", collections:selected(params.get("planCollections"),["seasonal","events"]),themes:selected(params.get("planThemes"),["nature","food","culture","ev"]),sort: planSorts.some(([value])=>value===sort)?sort as PlanSearchSort:"relevance" };
}
export function hasPlanSearch(state: PlanSearchState) { return !!(state.query.trim() || state.themes?.length || state.duration.trim()&&durationDays(state.duration,state.unit)===null); }
export function planSearchParams(state: PlanSearchState, base = new URLSearchParams()) {
 const params = new URLSearchParams(base);
 const values = { planQuery: requestText(state.query), planCountry: state.country, planDuration: state.duration,
 planDurationUnit: state.unit !== "days" ? state.unit : "", planSort: state.sort !== "relevance" ? state.sort : "",planCollections:(state.collections??[]).join(","),planThemes:(state.themes??[]).join(",") };
 for (const [key,value] of Object.entries(values)) { if(value) params.set(key,value); else params.delete(key); }
 if(params.get("tab") !== "guides" && params.get("tab") !== "places") params.delete("term");
 return params;
}
export function partitionPlanResults<T extends { token: string }>(recommended: T[], matches: T[]) {
 const unique = (items: T[]) => [...new Map(items.map(item => [item.token,item])).values()];
 const recommendations=unique(recommended), ids=new Set(recommendations.map(item=>item.token));
 return { recommendations, results: unique(matches).filter(item=>!ids.has(item.token)) };
}
