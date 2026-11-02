import assert from 'node:assert/strict';
import { test } from 'node:test';
import { register } from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const { buildPlanSuggestions, matchKnownPlans }=await import('../../app/feature/explore/_components/shared-plans/search/search-suggestions.ts');
test('Jap offers Japan and travel queries without a server response',()=>{
 const result=buildPlanSuggestions('Jap','',[]);
 assert.equal(result.destinations[0].label,'Japan');
 assert.equal(result.destinations[0].count,undefined);
 assert.ok(result.queries.includes('Japan road trip'));
});
test('country filter constrains generic destinations and remote counts replace unknown counts',()=>{
 assert.equal(buildPlanSuggestions('Jap','TH',[]).destinations.length,0);
 const result=buildPlanSuggestions('Jap','',[{id:'country:JP',label:'Japan',country:'JP',kind:'country',count:3}]);
 assert.equal(result.destinations.filter(x=>x.country==='JP').length,1);
 assert.equal(result.destinations[0].count,3);
});
test('generic suggestions normalize aliases and accents and ignore stale remote suggestions',()=>{
 assert.equal(buildPlanSuggestions('USA','',[]).destinations[0].country,'US');
 assert.equal(buildPlanSuggestions('reun','',[]).destinations[0].country,'RE');
 assert.equal(buildPlanSuggestions('Jap','',[{id:'country:TH',label:'Thailand',country:'TH',kind:'country',count:2}]).destinations.some(x=>x.country==='TH'),false);
 assert.deepEqual(buildPlanSuggestions('j','',[]),{destinations:[],queries:[]});
});

test('real public plan titles complete immediately and respect country and duration',()=>{
 const plan={token:'real',title:'Japan discovery',destinationCountry:'Japan',destinationCity:'Tokyo',dayCount:4};
 const state={country:'',duration:'',unit:'days',query:'',sort:'relevance'};
 assert.deepEqual(matchKnownPlans('Jap',state,[plan,plan]),[plan]);
 assert.deepEqual(matchKnownPlans('Jap',{...state,country:'TH'},[plan]),[]);
 assert.deepEqual(matchKnownPlans('Jap',{...state,duration:'5'},[plan]),[]);
 assert.deepEqual(matchKnownPlans('Bangkok',state,[plan]),[]);
});
