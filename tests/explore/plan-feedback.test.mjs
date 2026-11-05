import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {feedbackSummarySchema, commentPageSchema, feedbackRequest}=await import('../../app/feature/planner/_components/share/feedback/feedback-api.ts');
test('feedback rejects fabricated/out of range aggregates and preserves empty real totals',()=>{
 assert.equal(feedbackSummarySchema.parse({ratingAverage:null,ratingCount:0,commentCount:0,myRating:null,publisher:false}).ratingCount,0);
 assert.equal(feedbackSummarySchema.safeParse({ratingAverage:8,ratingCount:1,commentCount:0,publisher:false}).success,false);
 assert.equal(commentPageSchema.safeParse({content:[],page:0,total:0,hasMore:false}).success,true);
});
test('failed mutations preserve server status and safe message',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({message:'This comment changed. Reload it before editing.'},{status:409}));
 await assert.rejects(feedbackRequest('token','comments/id',{method:'PUT',body:JSON.stringify({content:'edit',version:1})}),e=>e.status===409&&/Reload/.test(e.message));
});
test('successful empty mutation responses are accepted and signals are forwarded',async t=>{
 const controller=new AbortController();let captured;
 t.mock.method(globalThis,'fetch',async(url,init)=>{captured={url,init};return new Response(null,{status:204});});
 await feedbackRequest('a/b','rating',{method:'DELETE',signal:controller.signal});
 assert.equal(captured.url,'/api/shared-plans/a%2Fb/feedback/rating');assert.equal(captured.init.signal,controller.signal);
});
