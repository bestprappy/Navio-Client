import assert from 'node:assert/strict';
import { test } from 'node:test';
import { register } from 'node:module';
register(new URL('../support/typescript-loader.mjs', import.meta.url));
register('data:text/javascript,'+encodeURIComponent('export async function resolve(s,c,n){return n(s==="next/server"?"next/server.js":s,c)}'));
const { NextRequest }=await import('next/server.js');
const { GET }=await import('../../app/api/shared-plans/search/route.ts');
const empty={content:[],recommendations:[],destinations:[],plans:[],number:0,last:true,totalElements:0,matchedCount:0};
async function withFetch(handler,run){const oldFetch=globalThis.fetch,oldBase=process.env.NAVIO_API_BASE_URL;process.env.NAVIO_API_BASE_URL='http://search-test.invalid';globalThis.fetch=handler;try{await run();}finally{globalThis.fetch=oldFetch;if(oldBase===undefined)delete process.env.NAVIO_API_BASE_URL;else process.env.NAVIO_API_BASE_URL=oldBase;}}
const request=query=>new NextRequest('http://localhost/api/shared-plans/search?'+query,{headers:{authorization:'Bearer should-not-forward',cookie:'private=should-not-forward'}});
test('search proxy validates parameters before contacting upstream',async()=>{await withFetch(()=>{throw new Error('Unexpected upstream request');},async()=>{for(const q of ['days=0','size=49','page=501','country=private','sort=invalid']){const r=await GET(request(q));assert.equal(r.status,400);assert.equal(r.headers.get('cache-control'),'no-store');}});});
test('search proxy forwards only public search parameters without credentials',async()=>{await withFetch(async(url,options)=>{assert.equal(url.pathname,'/v1/shared-plans/search');assert.equal(url.searchParams.get('days'),'4');assert.equal(url.searchParams.has('token'),false);assert.deepEqual(options.headers,{Accept:'application/json'});assert.equal(options.cache,'no-store');return Response.json(empty);},async()=>{const r=await GET(request('term=Japan&country=JP&days=4&token=private'));assert.equal(r.status,200);assert.deepEqual(await r.json(),empty);assert.equal(r.headers.get('cache-control'),'no-store');});});
test('search proxy reports undeployed endpoint and rejects invalid successful payload',async()=>{await withFetch(async()=>new Response(null,{status:404}),async()=>assert.equal((await GET(request('term=Japan'))).status,503));await withFetch(async()=>Response.json({privateData:'must not escape'}),async()=>{const r=await GET(request('term=Japan'));assert.equal(r.status,502);assert.equal(JSON.stringify(await r.json()).includes('privateData'),false);});});
