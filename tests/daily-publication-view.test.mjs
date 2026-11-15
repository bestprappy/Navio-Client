import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { dailyPublicationReadId } from "../lib/daily-publication-read.ts";
import * as visitor from "../lib/visitor-id.ts";
const require = createRequire(import.meta.url);
function moduleFrom(file, dependencies) {
 const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={}; vm.runInNewContext(code,{exports,Request,Headers,URL,Date,crypto,require:n=>dependencies[n]??require(n)}); return exports;
}
const browser="11111111-1111-4111-8111-111111111111", resource="/v1/shared-plans/CaseSensitive/feedback/view";
test("receipt is stable for a browser, publication and UTC day",()=>{
 const first=dailyPublicationReadId(browser,resource,new Date("2026-11-15T00:00:00Z"));
 assert.match(first,/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 assert.equal(first,dailyPublicationReadId(browser.toUpperCase(),resource,new Date("2026-11-15T23:59:59.999Z")));
 assert.notEqual(first,dailyPublicationReadId(browser,resource,new Date("2026-11-16T00:00:00Z")));
 assert.notEqual(first,dailyPublicationReadId("22222222-2222-4222-8222-222222222222",resource,new Date("2026-11-15")));
 assert.notEqual(first,dailyPublicationReadId(browser,resource.toLowerCase(),new Date("2026-11-15")));
});
test("Guide source namespaces cannot collide",()=>{
 const date=new Date("2026-11-15");
 assert.notEqual(dailyPublicationReadId(browser,"/v1/traveler-guides/discovery/CURATED/id/view",date),dailyPublicationReadId(browser,"/v1/traveler-guides/discovery/TRAVELER/id/view",date));
});
test("BFF replaces per-opening UUIDs but always forwards to attach signed-in accounts",async()=>{
 const calls=[];
 const {proxyDailyPublicationView}=moduleFrom("../app/api/_lib/daily-publication-view.ts",{
  "@/lib/daily-publication-read":{dailyPublicationReadId},"@/lib/visitor-id":visitor,
  "./authenticated-api-proxy":{proxyAuthenticatedApiRequest:async(req,path,options)=>{calls.push({body:await req.json(),path,options,origin:req.headers.get('origin')});return new Response(null,{status:204});}},
  "next/server":{NextResponse:class extends Response{cookies={set(){}}}},Response,
 });
 for(let i=0;i<3;i++){
  const request=new Request("https://navio.test/api/view",{method:'POST',headers:{origin:'https://navio.test'},body:JSON.stringify({readId:crypto.randomUUID()})});
  request.cookies={get:()=>({value:browser})};
  assert.equal((await proxyDailyPublicationView(request,resource)).status,204);
 }
 assert.equal(new Set(calls.map(x=>x.body.readId)).size,1);
 assert.equal(calls.length,3);
 assert.ok(calls.every(x=>x.options.allowAnonymous&&x.origin==='https://navio.test'));
});
test("first API visit issues private browser identity and preserves failed response for retry",async()=>{
 const cookies=[];
 const {proxyDailyPublicationView}=moduleFrom("../app/api/_lib/daily-publication-view.ts",{
  "@/lib/daily-publication-read":{dailyPublicationReadId},"@/lib/visitor-id":visitor,
  "./authenticated-api-proxy":{proxyAuthenticatedApiRequest:async()=>new Response('unavailable',{status:503})},
  "next/server":{NextResponse:class extends Response{cookies={set:cookie=>cookies.push(cookie)}}},Response,
 });
 const req=new Request('https://navio.test/api/view',{method:'POST'});req.cookies={get:()=>undefined};
 const response=await proxyDailyPublicationView(req,resource);
 assert.equal(response.status,503);assert.equal(await response.text(),'unavailable');
 assert.equal(cookies.length,1);assert.equal(cookies[0].httpOnly,true);assert.equal(cookies[0].secure,true);assert.equal(cookies[0].sameSite,'lax');
 assert.equal(cookies[0].name,visitor.VISITOR_COOKIE);assert.equal(cookies[0].path,'/');
});

test("view route validation is retained before cookie and upstream handling",async()=>{
 const calls=[];
 for(const [file,params] of [["../app/api/shared-plans/[token]/feedback/view/route.ts",{token:"share"}],["../app/api/traveler-guides/discovery/[source]/[id]/view/route.ts",{source:"TRAVELER",id:browser}]]){
  const {POST}=moduleFrom(file,{
   "next/server":{NextResponse:{json:(body,options)=>Response.json(body,options)}},
   "@/app/api/admin/guides/guide-routes":{GUIDE_ID_PATTERN:/^[0-9a-f-]{36}$/i},
   "@/app/api/_lib/daily-publication-view":{proxyDailyPublicationView:(req,path)=>{calls.push(path);return new Response(null,{status:204});}},
  });
  assert.equal((await POST(new Request('https://navio.test/api/view',{method:'POST',body:'{}'}),{params:Promise.resolve(params)})).status,400);
  assert.equal((await POST(new Request('https://navio.test/api/view',{method:'POST',body:JSON.stringify({readId:browser})}),{params:Promise.resolve(params)})).status,204);
 }
 assert.equal(calls.length,2);
});
test("both Shared Plan reader entry points use bounded top navigation",()=>{
 for(const file of ['../app/explore/shared/[token]/page.tsx','../app/share/plans/[token]/page.tsx']){
  const source=readFileSync(new URL(file,import.meta.url),'utf8');
  assert.ok(source.includes('<Navbar />'));
  assert.ok(!source.includes('SidebarWrapper'));
  assert.ok(source.includes('fixed inset-0 flex min-h-0 flex-col overflow-hidden'));
  assert.ok(source.includes('min-h-0 min-w-0 flex-1 overflow-hidden'));
 }
});

test("a reader left open overnight can record its next visible UTC day",async()=>{
 let now='2026-11-15T23:59:59Z',listener,requests=[];
 const code=ts.transpileModule(readFileSync(new URL('../hooks/use-publication-read.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const effects=[],exports={};
 class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}}
 vm.runInNewContext(code,{exports,crypto,Date:Clock,document:{visibilityState:'visible',addEventListener:(type,fn)=>listener=fn,removeEventListener(){}},fetch:async()=>{requests.push(now);return {ok:true};},require:n=>n==='react'?{useRef:value=>({current:value}),useState:value=>[value,()=>{}],useEffect:fn=>effects.push(fn)}:require(n)});
 exports.usePublicationRead({url:'/api/view',identity:'guest',loading:false,onRecorded:async()=>{}});
 effects.forEach(fn=>fn());await new Promise(resolve=>setTimeout(resolve,0));
 listener();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(requests.length,1);
 now='2026-11-16T00:00:01Z';listener();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(requests.length,2);
 listener();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(requests.length,2);
});
