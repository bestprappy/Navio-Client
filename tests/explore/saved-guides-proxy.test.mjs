import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function route(){const calls=[];const exports={};const source=readFileSync(new URL('../../app/api/users/me/saved/[[...path]]/route.ts',import.meta.url),'utf8');vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,URL,Request,require:()=>({proxyAuthenticatedApiRequest:async(request,path)=>{calls.push({url:new URL(request.url),path,method:request.method,body:request.method==='POST'?await request.json():null});return new Response();}})});return {calls,...exports};}
test('Saved API forwards Guide opt-in without losing active search parameters',async()=>{
 const api=route();await api.GET(new Request('http://localhost/api/users/me/saved?tab=GUIDE&search=Tokyo&country=Japan&page=1&includeGuides=true'),{params:Promise.resolve({})});
 assert.equal(api.calls[0].url.searchParams.get('includeGuides'),'true');assert.equal(api.calls[0].url.searchParams.get('tab'),'GUIDE');assert.equal(api.calls[0].url.searchParams.get('page'),'1');assert.equal(api.calls[0].url.searchParams.get('country'),'Japan');
});
test('Guide saves keep their body and authenticated path',async()=>{
 const api=route();await api.POST(new Request('http://localhost/api/users/me/saved/guides',{method:'POST',body:JSON.stringify({id:'guide',source:'CURATED'})}),{params:Promise.resolve({path:['guides']})});
 assert.equal(api.calls[0].path,'/v1/users/me/saved/guides');assert.equal(api.calls[0].body.source,'CURATED');
});
