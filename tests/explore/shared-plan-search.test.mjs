import assert from "node:assert/strict";
import { test } from "node:test";
import { register } from "node:module";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { parsePlanSearch, planSearchParams, durationDays, hasPlanSearch, partitionPlanResults } = await import("../../app/feature/explore/_components/shared-plans/search/search-state.ts");
test("empty text and filters stays the existing landing page",()=>{
 assert.equal(hasPlanSearch(parsePlanSearch(new URLSearchParams())),false);
 assert.equal(hasPlanSearch(parsePlanSearch(new URLSearchParams("term=%20%20&planDurationUnit=years"))),false);
});
test("exact duration uses explicit planning units and rejects invalid input",()=>{
 assert.equal(durationDays("4","days"),4); assert.equal(durationDays("2","months"),60); assert.equal(durationDays("1","years"),365);
 for(const value of ["0","-1","1.5","abc","1e2","99999999999999999"]) assert.equal(durationDays(value,"days"),null);
 assert.equal(durationDays("","years"),null);
});
test("search URL roundtrips without changing Places parameters",()=>{
 const state=parsePlanSearch(new URLSearchParams("term=Japan&planCountry=JP&planDuration=4&planDurationUnit=days&planSort=recent"));
 assert.equal(state.country,"JP"); assert.equal(state.query,"Japan"); assert.equal(hasPlanSearch(state),true);
 assert.deepEqual(parsePlanSearch(planSearchParams(state,new URLSearchParams("tab=plans&country=TH"))),state);
 assert.equal(planSearchParams(state,new URLSearchParams("country=TH")).get("country"),"TH");
 assert.equal(parsePlanSearch(new URLSearchParams("planCountry=INVALID&planSort=wrong")).country,"");
});
test("recommended plans do not appear again among paginated matches",()=>{
 const p=id=>({token:id});const out=partitionPlanResults([p("a"),p("b")],[p("a"),p("c"),p("c")]);
 assert.deepEqual(out.recommendations.map(x=>x.token),["a","b"]);assert.deepEqual(out.results.map(x=>x.token),["c"]);
});

test("a unit can be chosen before entering a number without activating search",()=>{
 const state={query:"",country:"",duration:"",unit:"months",sort:"relevance"};
 const parsed=parsePlanSearch(planSearchParams(state));assert.equal(parsed.unit,"months");assert.equal(hasPlanSearch(parsed),false);
});
