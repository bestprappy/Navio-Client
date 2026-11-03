import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {buildPlanSuggestions,knownPlanSuggestions}=await import('../../app/feature/explore/_components/shared-plans/search/search-suggestions.ts');
test('Christmas completion preserves country without replacing event with generic templates',()=>{
 const values=buildPlanSuggestions('Thailand Christ','',[]).queries;
 assert.ok(values.includes('Thailand Christmas'));
 assert.ok(values.every(v=>!v.includes('road trip')&&!v.includes('weekend trip')));
});
test('country completion is useful without inventing three travel phrases',()=>{
 const values=buildPlanSuggestions('Jap','',[]);
 assert.equal(values.destinations[0].label,'Japan');
 assert.ok(!values.queries.includes('Japan road trip'));
});
test('incomplete local summaries do not guess missing event or food evidence',()=>{
 const state={query:'Thailand Christmas trip',country:'',duration:'',unit:'days',sort:'relevance'};
 const plan={token:'coast',title:'Coastal holiday',destinationCountry:'Thailand',dayCount:3,highlights:[]};
 assert.deepEqual(knownPlanSuggestions(state.query,state,[plan]),{matching:[],related:[]});
});

test('local title completions never discard the typed activity',()=>{
 const plan={token:'sushi',title:'City break',destinationCountry:'Thailand',dayCount:3,highlights:['Sushi restaurant']};
 assert.ok(!buildPlanSuggestions('Thailand sushi','',[],[plan]).queries.includes('City break'));
});
