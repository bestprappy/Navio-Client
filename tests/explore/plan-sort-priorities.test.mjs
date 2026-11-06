import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const s=await import('../../app/feature/explore/_components/shared-plans/search/search-state.ts');
test('ordered sort URL roundtrip and invalid values fail to Recommended',()=>{
 const state=s.parsePlanSearch(new URLSearchParams('planSort=rating,views,recent'));
 assert.equal(state.sort,'rating,views,recent');assert.deepEqual(s.parsePlanSearch(s.planSearchParams(state)),state);
 for(const value of ['rating,rating','rating,','rating,invalid','relevance,views',',views'])assert.equal(s.parsePlanSearch(new URLSearchParams({planSort:value})).sort,'relevance');
});
test('sort choices retain order, reorder within bounds and restore default when empty',()=>{
 let value=s.togglePlanSort('relevance','rating');assert.equal(value,'rating');
 value=s.togglePlanSort(value,'views');assert.equal(value,'rating,views');
 assert.equal(s.movePlanSort(value,'views',-1),'views,rating');assert.equal(s.movePlanSort(value,'rating',-1),value);
 assert.equal(s.togglePlanSort(value,'relevance'),'relevance');
 assert.equal(s.togglePlanSort(s.togglePlanSort(value,'rating'),'views'),'relevance');
 assert.equal(s.planSortLabel(value),'Highest rated \u2192 Most viewed');
});
