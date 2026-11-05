import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {parsePlanSearch,planSearchParams,hasPlanSearch}=await import('../../app/feature/explore/_components/shared-plans/search/search-state.ts');
const {applyPlanFilters}=await import('../../app/feature/explore/_components/shared-plans/search/search-state.ts');
test('discovery URL restores valid collections, themes and all supported sorts',()=>{
 const state=parsePlanSearch(new URLSearchParams('planCollections=events,seasonal&planThemes=ev,nature&planSort=rating'));
 assert.deepEqual(state.collections,['seasonal','events']);assert.deepEqual(state.themes,['nature','ev']);assert.equal(state.sort,'rating');
 assert.deepEqual(parsePlanSearch(planSearchParams(state)),state);
 assert.deepEqual(parsePlanSearch(new URLSearchParams('planCollections=invalid&planThemes=unsafe')).collections,[]);
});
test('collection-only browsing keeps sections; themes without text use result mode',()=>{
 assert.equal(hasPlanSearch(parsePlanSearch(new URLSearchParams('planCollections=events'))),false);
 assert.equal(hasPlanSearch(parsePlanSearch(new URLSearchParams('planThemes=food'))),true);
});
test('applying a draft filter preserves newer search and country edits',()=>{
 const latest={query:'Thailand Christmas ',country:'TH',duration:'4',unit:'days',sort:'relevance'};
 const draft={...latest,query:'Old text',country:'JP',sort:'rating',themes:['food'],collections:['events']};
 const applied=applyPlanFilters(latest,draft);
 assert.equal(applied.query,latest.query);assert.equal(applied.country,'TH');assert.equal(applied.sort,'rating');assert.deepEqual(applied.themes,['food']);
});
