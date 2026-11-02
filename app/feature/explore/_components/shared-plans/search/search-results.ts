import type { ExplorePlan } from '../explore-plans-api';
import type { PlanSearchPage } from './search-api';
export function groupPlanSearchPages(pages: Partial<PlanSearchPage>[]) {
 const unique=(plans:ExplorePlan[])=>[...new Map(plans.map(plan=>[plan.token,plan])).values()];
 const matching=unique(pages.flatMap(page=>page.matching??[...(page.recommendations??[]),...(page.content??[])]));
 const ids=new Set(matching.map(plan=>plan.token));
 const related=unique(pages.flatMap(page=>page.related??[])).filter(plan=>!ids.has(plan.token));
 return {matching,related,reasons:Object.fromEntries(pages.flatMap(page=>Object.entries(page.reasons??{})))};
}
