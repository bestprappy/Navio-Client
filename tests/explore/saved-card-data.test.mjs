import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {savedGuideSummary,loadSavedPublication}=await import('../../app/feature/saved/saved-card-data.ts');
test('saved Guide retains source, cover, description and author from public detail',async()=>{
 const guide={id:'20000000-0000-4000-8000-000000000001',name:'Food walk',country:'Japan',countryCode:'JP',destination:{provider:'GOOGLE',providerPlaceId:'Tokyo',name:'Tokyo',lat:1,lng:2},description:'Read the city through its food.',coverPlaceId:'photo',categories:[],body:'',lists:{},places:{},publishedAt:'2026-01-01',updatedAt:'2026-02-01'};
 const result=savedGuideSummary({guide,author:{displayName:'Writer'}},'CURATED');
 assert.equal(result.coverPlaceId,'photo');assert.equal(result.description,guide.description);assert.equal(result.source,'CURATED');assert.equal(result.author.displayName,'Writer');
 let requested;
 const actual=await loadSavedPublication({type:'GUIDE',identity:`guide:curated:${guide.id}`},undefined,{readMetrics:async()=>({viewCount:12,ratingAverage:4.5,ratingCount:3}),readGuide:async(id,source)=>{requested=[id,source];return {guide,author:{displayName:'Writer'}};},readPlan:async()=>{throw Error('wrong service');}});
 assert.deepEqual(requested,[guide.id,'CURATED']);assert.equal(actual.kind,'guide');assert.equal(actual.guide.viewCount,12);assert.equal(actual.guide.ratingCount,3);
});
test('saved plan loads real summary without discovery or provider requests',async()=>{
 const plan={token:'token',title:'Amsterdam',placeCount:11,highlights:['Canals'],days:[],dayCount:3,chargerCount:0};
 const actual=await loadSavedPublication({type:'PLAN',identity:'plan:token'},undefined,{readPlan:async token=>{assert.equal(token,'token');return plan;}});
 assert.equal(actual.plan.placeCount,11);assert.deepEqual(actual.plan.highlights,['Canals']);
});
test('unavailable publications keep a bookmark fallback, never another trip',async()=>{
 assert.equal(await loadSavedPublication({type:'PLAN',identity:'plan:token'},undefined,{readPlan:async()=>null}),null);
 await assert.rejects(()=>loadSavedPublication({type:'GUIDE',identity:'guide:invalid:x'}),/unavailable/);
});
