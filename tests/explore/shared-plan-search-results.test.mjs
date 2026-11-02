import assert from 'node:assert/strict';
import { test } from 'node:test';
import { register } from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const { groupPlanSearchPages }=await import('../../app/feature/explore/_components/shared-plans/search/search-results.ts');
test('matching and related groups stay distinct across all pages',()=>{
 const a={token:'a'},b={token:'b'},c={token:'c'};
 const result=groupPlanSearchPages([{matching:[a],related:[b],reasons:{b:'Also in Thailand'}},{matching:[b],related:[a,c],reasons:{c:'Includes food stops'}}]);
 assert.deepEqual(result.matching,[a,b]);assert.deepEqual(result.related,[c]);assert.equal(result.reasons.c,'Includes food stops');
});
test('an empty matching pool preserves related alternatives and legacy responses still render',()=>{
 assert.equal(groupPlanSearchPages([{matching:[],related:[{token:'b'}]}]).related.length,1);
 assert.deepEqual(groupPlanSearchPages([{recommendations:[{token:'a'}],content:[{token:'b'}]}]).matching.map(x=>x.token),['a','b']);
});
