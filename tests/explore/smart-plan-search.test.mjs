import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const results=await import('../../app/feature/explore/_components/shared-plans/search/search-results.ts');
const state={query:'Thailand Christmas',country:'',duration:'',unit:'days',sort:'relevance'};
const base={matchingTotal:0,relatedTotal:0};
for(const [name,matchingTotal,relatedTotal,alternatives,expected] of [
 ['both pools',2,3,0,'results'],['matching only',2,0,0,'results'],['relevant only',0,3,0,'relevant'],
 ['combined above alternatives',0,0,2,'alternatives'],['one final empty panel',0,0,0,'empty']
])test(name,()=>assert.equal(results.planSearchPresentation?.({...base,matchingTotal,relatedTotal},alternatives,false),expected));
test('pending and missing responses cannot be reported as empty',()=>{
 assert.equal(results.planSearchPresentation?.(undefined,0,false),'loading');
 assert.equal(results.planSearchPresentation?.(base,0,true),'loading');
});
test('authoritative positive totals override an empty currently loaded card array',()=>assert.equal(results.planSearchPresentation?.({...base,matchingTotal:4,matching:[]},0,false),'results'));
test('assistance must match text and every active filter before use',()=>{
 const response={searchAssist:{query:'Thailand Christmas',country:'',days:null,sort:'relevance',suggestions:[]}};
 assert.equal(results.currentSearchAssist?.(response,state)?.query,state.query);
 for(const changed of [{query:'Japan'},{country:'TH'},{duration:'3'},{sort:'recent'}])assert.equal(results.currentSearchAssist?.(response,{...state,...changed}),undefined);
});
test('confirmed-empty alternatives and rewrites are excluded from result recovery',()=>{
 const suggestions=[{text:'Rewrite',kind:'rewrite',availability:'available'},{text:'Empty',kind:'broaden',availability:'none'},{text:'Broader',kind:'broaden',availability:'available'},{text:'Idea',kind:'refine',availability:'unknown'}];
 assert.deepEqual(results.usefulSearchAlternatives?.({suggestions})?.map(s=>s.text),['Broader','Idea']);
});
test('pagination binds its revision to the freshly fetched page rather than old cached first data',()=>{
 const first={number:0,matchingLast:false,relatedLast:true,searchAssist:{catalogueRevision:'new-revision'}};
 assert.deepEqual(results.nextPlanSearchPage?.(first),{number:1,revision:'new-revision'});
 assert.equal(results.nextPlanSearchPage?.({...first,matchingLast:true}),undefined);
});
