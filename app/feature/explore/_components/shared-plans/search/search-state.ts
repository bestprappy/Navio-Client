import { requestText } from "./search-draft";
import { countries } from "../../../places/search-state";
export type DurationUnit = "days" | "months" | "years";
export const planSorts=[['relevance','Recommended'],['recent','Newest shared'],['trending','Trending'],['popular','Most copied'],['views','Most viewed'],['rating','Highest rated'],['discussed','Most discussed']] as const;
export type PlanSearchSort = typeof planSorts[number][0];
export type PlanSortOrder = PlanSearchSort | `${PlanSearchSort},${string}`;
/** Public sort parameter is an ordered, bounded list; Recommended is the exclusive default. */
export function parsePlanSort(value:string|null):PlanSortOrder|null {
 if(!value||value.length>100)return null;
 const values=value.split(',');
 if(values.length>6||new Set(values).size!==values.length||values.length>1&&values.includes('relevance')||!values.every(v=>planSorts.some(([key])=>key===v)))return null;
 return value as PlanSortOrder;
}
export function planSortValues(value:PlanSortOrder):PlanSearchSort[]{return (parsePlanSort(value)??'relevance').split(',') as PlanSearchSort[];}
export function planSortLabel(value:PlanSortOrder):string{return planSortValues(value).map(key=>planSorts.find(([v])=>v===key)![1]).join(' \u2192 ');}
export function togglePlanSort(order:PlanSortOrder,value:PlanSearchSort):PlanSortOrder{
 if(value==='relevance')return 'relevance';
 const selected=planSortValues(order).filter(v=>v!=='relevance');
 return parsePlanSort((selected.includes(value)?selected.filter(v=>v!==value):[...selected,value]).join(','))??'relevance';
}
export function movePlanSort(order:PlanSortOrder,value:PlanSearchSort,direction:-1|1):PlanSortOrder{
 const values=planSortValues(order),index=values.indexOf(value),target=index+direction;
 if(index<0||target<0||target>=values.length)return order;
 [values[index],values[target]]=[values[target],values[index]];
 return parsePlanSort(values.join(','))??'relevance';
}

const selected=(raw:string|null,allowed:readonly string[])=>allowed.filter(value=>(raw??'').split(',').includes(value));
export type PlanSearchState = { query: string; country: string; duration: string; unit: DurationUnit; sort: PlanSortOrder; collections?:string[]; themes?:string[] };
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
 unit: unit === "months" || unit === "years" ? unit : "days", collections:selected(params.get("planCollections"),["seasonal","events"]),themes:selected(params.get("planThemes"),["nature","food","culture","ev"]),sort: parsePlanSort(sort)??"relevance" };
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
