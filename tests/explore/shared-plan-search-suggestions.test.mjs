import assert from 'node:assert/strict';
import { test } from 'node:test';
import { register } from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const { buildPlanSuggestions, matchKnownPlans }=await import('../../app/feature/explore/_components/shared-plans/search/search-suggestions.ts');
test('Jap offers Japan and travel queries without a server response',()=>{
 const result=buildPlanSuggestions('Jap','',[]);
 assert.equal(result.destinations[0].label,'Japan');
 assert.equal(result.destinations[0].count,undefined);
 assert.ok(result.queries.includes('Japan'));
 assert.ok(!result.queries.includes('Japan road trip'));
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

test('multiword phrases retain travel suggestions with no catalogue matches',()=>{
 for(const text of ['Thailand Food Trip','Huahin scenary and food trip','California Food Focus Trip']) {
  const result=buildPlanSuggestions(text,'',[]);
  assert.ok(result.queries.every(q=>!q.includes('weekend trip')&&!q.includes('road trip')),text);
 }
 assert.ok(buildPlanSuggestions('Huahin scenary and food trip','',[]).queries.some(q=>q.includes('Hua Hin')&&q.includes('scenic')&&q.includes('food')));
});
test('country plus partial city completes from real catalogue destinations',()=>{
 const plans=[{token:'hua',title:'Coastal escape',destinationCity:'Hua Hin',destinationCountry:'Thailand',dayCount:4}];
 assert.ok(buildPlanSuggestions('Thailand Hua','',[],plans).queries.includes('Thailand Hua Hin'));
});

test('multiword location completion replaces the unfinished span instead of duplicating words',()=>{
 const plans=[{token:'hua',title:'Coastal escape',destinationCity:'Hua Hin',destinationCountry:'Thailand',dayCount:4},{token:'ny',title:'City walks',destinationCity:'New York',destinationCountry:'United States',dayCount:4}];
 assert.ok(buildPlanSuggestions('Thailand Hua Hi','',[],plans).queries.includes('Thailand Hua Hin'));
 assert.ok(buildPlanSuggestions('New Yo','',[],plans).queries.includes('New York'));
 assert.ok(!buildPlanSuggestions('New Ne','',[],plans).queries.includes('New New York'));
});

test('unfinished travel words complete inside a longer destination phrase',()=>{
 assert.ok(buildPlanSuggestions('Japan fo','',[]).queries.some(q=>q==='Japan food trip'));
 assert.ok(buildPlanSuggestions('Thailand camp','',[]).queries.some(q=>q==='Thailand camping trip'));
});
