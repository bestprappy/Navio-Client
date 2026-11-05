import type { ExplorePlan } from '../explore-plans-api';
import type { PlanSearchPage,SearchAssist } from './search-api';
export function groupPlanSearchPages(pages: Partial<PlanSearchPage>[]) {
 const unique=(plans:ExplorePlan[])=>[...new Map(plans.map(plan=>[plan.token,plan])).values()];
 const matching=unique(pages.flatMap(page=>page.matching??[...(page.recommendations??[]),...(page.content??[])]));
 const ids=new Set(matching.map(plan=>plan.token));
 const related=unique(pages.flatMap(page=>page.related??[])).filter(plan=>!ids.has(plan.token));
 return {matching,related,reasons:Object.fromEntries(pages.flatMap(page=>Object.entries(page.reasons??{})))};
}
import {durationDays,type PlanSearchState} from './search-state';

export function planSearchPresentation(page:Pick<PlanSearchPage,'matchingTotal'|'relatedTotal'|'matchedCount'>|undefined,alternatives:number,pending:boolean){
 if(pending||!page)return 'loading';
 if((page.matchingTotal??page.matchedCount??0)>0)return 'results';
 if((page.relatedTotal??0)>0)return 'relevant';
 return alternatives>0?'alternatives':'empty';
}
export function currentSearchAssist(page:Pick<PlanSearchPage,'searchAssist'>|undefined,state:PlanSearchState):SearchAssist|undefined{
 const assist=page?.searchAssist;
 if(!assist||assist.query!==state.query.trim()||assist.country!==state.country||assist.days!==(durationDays(state.duration,state.unit)??null)||assist.sort!==state.sort)return undefined;
 return assist;
}
export function usefulSearchAlternatives(assist:Pick<SearchAssist,'suggestions'>|undefined){
 return (assist?.suggestions??[]).filter(s=>s.kind!=='rewrite'&&s.availability!=='none').slice(0,2);
}
export function nextPlanSearchPage(page:Pick<PlanSearchPage,'number'|'matchingLast'|'relatedLast'|'last'|'searchAssist'>){
 const done=page.matchingLast!==undefined&&page.relatedLast!==undefined?page.matchingLast&&page.relatedLast:page.last;
 return done?undefined:{number:page.number+1,revision:page.searchAssist?.catalogueRevision};
}
