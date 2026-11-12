import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../../../../tests/support/typescript-loader.mjs',import.meta.url));
const {emptyGuideSearch,parseGuideSearch,guideSearchParams,guideRequestParams,guideResultMode,nextGuidePage,groupGuidePages}=await import('./search-state.ts');
test('guide URL is isolated and canonical, rejecting unsupported priorities and collections',()=>{
 const prior=new URLSearchParams('tab=places&country=JP&placesQuery=park&planQuery=food&guideCountry=th&guideSort=views,popular,views,rating&guideCollections=food,desert,food&guideInterests=museums,unknown&guideTime=month:12');
 const state=parseGuideSearch(prior);
 assert.equal(state.country,'TH');assert.equal(state.sort,'views,popular');assert.deepEqual(state.collections,['food']);assert.deepEqual(state.interests,['museums']);
 const next=guideSearchParams({...state,query:'  Thai  food '},prior);
 assert.equal(next.get('country'),'JP');assert.equal(next.get('placesQuery'),'park');assert.equal(next.get('planQuery'),'food');assert.equal(next.get('guideQuery'),'Thai food');assert.equal(next.get('tab'),'guides');
 assert.equal(parseGuideSearch(new URLSearchParams('guideTime=month:13&guideCountry=XX')).time,'any');
});
test('country/time/collections keep shelves; text and interests show search results',()=>{
 assert.equal(guideResultMode({...emptyGuideSearch,country:'TH',time:'season:wet',collections:['food']}),false);
 assert.equal(guideResultMode({...emptyGuideSearch,query:' food '}),true);
 assert.equal(guideResultMode({...emptyGuideSearch,interests:['museums']}),true);
});
test('request params send full filters and server pagination, without browser truncation',()=>{
 const params=guideRequestParams({...emptyGuideSearch,query:'  Thai  food ',country:'TH',collections:['food','sweets'],interests:['museums'],sort:'views,recent'},3,6);
 assert.equal(params.get('term'),'Thai food');assert.equal(params.get('collections'),'food,sweets');assert.equal(params.get('interests'),'museums');assert.equal(params.get('sort'),'views,recent');assert.equal(params.get('page'),'3');assert.equal(params.get('size'),'6');
 assert.equal(nextGuidePage({number:0,last:false}),1);assert.equal(nextGuidePage({number:3,last:true}),undefined);
});
test('source qualified pagination deduplicates and never mixes relevant with matching',()=>{
 const a={id:'same',source:'TRAVELER'},b={id:'same',source:'CURATED'},c={id:'other',source:'TRAVELER'};
 const grouped=groupGuidePages([{matching:[a],relevant:[b,c]},{matching:[a,b],relevant:[c]}]);
 assert.deepEqual(grouped.matching,[a,b]);assert.deepEqual(grouped.relevant,[c]);
});


test('legacy guide term stays scoped to Guides and curated links keep source',async()=>{const {guideHref}=await import('./search-state.ts');assert.equal(parseGuideSearch(new URLSearchParams('tab=guides&term=Tokyo')).query,'Tokyo');assert.equal(parseGuideSearch(new URLSearchParams('tab=plans&term=Tokyo')).query,'');assert.match(guideHref({id:'same',source:'CURATED'}),/source=curated$/);});
