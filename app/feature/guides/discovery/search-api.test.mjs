import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../../../../tests/support/typescript-loader.mjs',import.meta.url));
const {fetchGuideDiscovery,guideDiscoveryPageSchema}=await import('./search-api.ts');
const {emptyGuideSearch}=await import('./search-state.ts');
const entry={id:'9de1752f-07a0-4d99-bda3-8279ae240e26',source:'CURATED',name:'A real published guide',country:'Thailand',countryCode:'TH',destinationName:'Bangkok',destinationProvider:'GOOGLE',destinationPlaceId:'offline-place',description:'Local discoveries',coverPlaceId:'',placeCount:3,categories:[],author:{displayName:'Navio'},publishedAt:'2026-11-12T00:00:00Z',updatedAt:'2026-11-12T00:00:00Z',viewCount:7,discoveryLabel:'popular',collections:['food']};
const page={content:[entry],matching:[entry],relevant:[],matchingTotal:1,relevantTotal:0,totalElements:1,number:0,last:true,suggestions:['Bangkok'],notice:null};
test('discovery schema accepts curated source and rejects unsupported source or invented negative metrics',()=>{
 assert.equal(guideDiscoveryPageSchema.safeParse(page).success,true);
 assert.equal(guideDiscoveryPageSchema.safeParse({...page,matching:[{...entry,source:'OTHER'}]}).success,false);
 assert.equal(guideDiscoveryPageSchema.safeParse({...page,matching:[{...entry,viewCount:-1}]}).success,false);
});
test('discovery fetch passes abort signal and full server page filters',async()=>{
 const original=globalThis.fetch,controller=new AbortController();
 try{globalThis.fetch=async(url,options)=>{assert.equal(options.signal,controller.signal);assert.match(String(url),/\/api\/traveler-guides\/discovery\?/);const query=new URL(String(url),'https://offline.invalid').searchParams;assert.equal(query.get('page'),'2');assert.equal(query.get('size'),'6');assert.equal(query.get('country'),'TH');return new Response(JSON.stringify(page));};assert.deepEqual(await fetchGuideDiscovery({...emptyGuideSearch,country:'TH'},2,controller.signal,6),page);}finally{globalThis.fetch=original;}
});
test('unexpected payloads and failed requests are actionable failures',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=async()=>new Response('{}');await assert.rejects(()=>fetchGuideDiscovery(emptyGuideSearch),/unexpected response/);globalThis.fetch=async()=>new Response('',{status:503});await assert.rejects(()=>fetchGuideDiscovery(emptyGuideSearch),/could not be loaded/);}finally{globalThis.fetch=original;}
});


test('legacy published guide without a publication timestamp remains readable in discovery',()=>{const parsed=guideDiscoveryPageSchema.parse({...page,matching:[{...entry,publishedAt:null}]});assert.equal(parsed.matching[0].publishedAt,'');});
