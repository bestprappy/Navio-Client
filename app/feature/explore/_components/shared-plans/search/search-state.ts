import { countries } from "../../../places/search-state";
export type DurationUnit = "days" | "months" | "years";
export type PlanSearchSort = "relevance" | "recent" | "trending";
export type PlanSearchState = { query: string; country: string; duration: string; unit: DurationUnit; sort: PlanSearchSort };
export const emptyPlanSearch: PlanSearchState = { query: "", country: "", duration: "", unit: "days", sort: "relevance" };
const units: Record<DurationUnit, number> = { days: 1, months: 30, years: 365 };
export function durationDays(value: string, unit: DurationUnit): number | null {
 if (!/^\d+$/.test(value)) return null;
 const days = Number(value) * units[unit];
 return Number.isSafeInteger(days) && days >= 1 && days <= 36500 ? days : null;
}
export function parsePlanSearch(params: URLSearchParams): PlanSearchState {
 const country = (params.get("planCountry") || "").toUpperCase();
 const unit = params.get("planDurationUnit"); const sort = params.get("planSort");
 return { query: (params.get("planQuery") ?? (params.get("tab") !== "guides" && params.get("tab") !== "places" ? params.get("term") : "") ?? "").slice(0,100),
 country: countries.some(c => c.code === country) ? country : "", duration: (params.get("planDuration") || "").slice(0,8),
 unit: unit === "months" || unit === "years" ? unit : "days", sort: sort === "recent" || sort === "trending" ? sort : "relevance" };
}
export function hasPlanSearch(state: PlanSearchState) { return !!(state.query.trim() || state.country || state.duration.trim()); }
export function planSearchParams(state: PlanSearchState, base = new URLSearchParams()) {
 const params = new URLSearchParams(base);
 const values = { planQuery: state.query.trim(), planCountry: state.country, planDuration: state.duration,
 planDurationUnit: state.unit !== "days" ? state.unit : "", planSort: state.sort !== "relevance" ? state.sort : "" };
 for (const [key,value] of Object.entries(values)) { if(value) params.set(key,value); else params.delete(key); }
 if(params.get("tab") !== "guides" && params.get("tab") !== "places") params.delete("term");
 return params;
}
export function partitionPlanResults<T extends { token: string }>(recommended: T[], matches: T[]) {
 const unique = (items: T[]) => [...new Map(items.map(item => [item.token,item])).values()];
 const recommendations=unique(recommended), ids=new Set(recommendations.map(item=>item.token));
 return { recommendations, results: unique(matches).filter(item=>!ids.has(item.token)) };
}
