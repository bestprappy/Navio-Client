import assert from "node:assert/strict";
import {readFileSync} from "node:fs";import {createRequire} from "node:module";import {test} from "node:test";import vm from "node:vm";import ts from "typescript";
const require=createRequire(import.meta.url);
function load({mode="development",session=null,fetcher=()=>assert.fail("Must not contact backend")}={}){
 const source=readFileSync(new URL("../../app/api/preview/shared-plans/route.ts",import.meta.url),"utf8");const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const exports={};
 const deps={"server-only":{},"@/app/api/_lib/with-authenticated-session":{withAuthenticatedSession:(request,fn)=>fn(request,session)},"@/app/api/_lib/upload-request":{isCrossOriginMutation:request=>request.headers.get("origin")==="https://evil.example"},"@/app/feature/planner/_components/share/reader/review-samples.data":{readerReviewSamples:[{label:"Review",shared:{plan:{startDate:"2027-03-10",endDate:"2027-03-12"}}}]},"@/app/feature/planner/_components/share/reader/review-source":{reviewPlannerSource:()=>({blocks:[],budget:{},energyState:{},options:{}})}};
 vm.runInNewContext(code,{exports,require:name=>deps[name]??require(name),process:{env:{NODE_ENV:mode,NAVIO_API_BASE_URL:"https://gateway.test"}},Request,Response,URL,URLSearchParams,AbortSignal,Map,fetch:fetcher});return exports;
}
const req=(body={confirm:true},origin="http://localhost:3000")=>new Request("http://localhost:3000/api/preview/shared-plans",{method:"POST",headers:{"Content-Type":"application/json",origin},body:JSON.stringify(body)});
test("example preparation is unavailable in production and denies cross-origin or signed-out writes",async()=>{
 assert.equal((await load({mode:"production"}).POST(req())).status,404);
 assert.equal((await load().POST(req({},"https://evil.example"))).status,403);
 assert.equal((await load().POST(req())).status,401);
 assert.equal((await load({session:{accessToken:"fixture",user:{id:"owner"}}}).POST(req({confirm:false}))).status,400);
});
test("an outdated connected backend receives no publication and only the newly created example is rolled back",async()=>{
 const id="11111111-1111-4111-8111-111111111111";const calls=[];
 const route=load({session:{accessToken:"fixture",user:{id:"owner"}},fetcher:async(url,init)=>{
  const path=new URL(url).pathname;calls.push([init.method,path]);
  if(init.method==="GET"&&path==="/v1/trips")return Response.json({content:[],totalPages:0});
  if(path.includes("autocomplete"))return Response.json({items:[{provider:"GOOGLE",providerPlaceId:"kyoto",mainText:"Kyoto"}]});
  if(init.method==="POST"&&path==="/v1/trips")return Response.json({id,version:0});
  if(path.endsWith("/planner"))return Response.json({capabilities:[]});
  if(init.method==="DELETE"&&path===`/v1/trips/${id}`)return new Response(null,{status:204});
  assert.fail("Unexpected backend operation");
 }});
 assert.equal((await route.POST(req())).status,502);assert.ok(calls.some(([method,path])=>method==="DELETE"&&path===`/v1/trips/${id}`));assert.equal(calls.some(([method])=>method==="PUT"),false);
});
