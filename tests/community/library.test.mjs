import assert from "node:assert/strict";
import {register} from "node:module";
import {test,afterEach} from "node:test";
register(new URL("../support/typescript-loader.mjs",import.meta.url));
const {listCommunityLibrary,saveCommunityPost,recordCommunityVisit,clearCommunityHistory}=await import("../../app/feature/saved/community-library-api.ts");
const {postFixture}=await import("./data.ts");
const originalFetch=globalThis.fetch;afterEach(()=>globalThis.fetch=originalFetch);
test("Community collection search and vote scope travel only to the social proxy",async()=>{
 globalThis.fetch=async(url,init)=>{const parsed=new URL(url,"http://test");assert.equal(parsed.pathname,"/api/social/me/library");assert.equal(parsed.searchParams.get("q"),"art & museums");assert.equal(parsed.searchParams.get("vote"),"down");assert.equal(parsed.searchParams.get("view"),"voted");assert.equal(parsed.searchParams.get("page"),"2");assert.equal(init.credentials,"same-origin");return Response.json({content:[{post:{...postFixture,saved:true},activityAt:postFixture.createdAt,commentId:null,commentBody:null}],number:2,totalElements:41,totalPages:3,last:true});};
 const result=await listCommunityLibrary("voted","art & museums","down","recent",2);assert.equal(result.content[0].post.saved,true);
});
test("Bookmark, visit and clear mutations are private same-origin and use no provider API",async()=>{
 const calls=[];globalThis.fetch=async(url,init)=>{calls.push([url,init.method]);return new Response(null,{status:204});};
 await saveCommunityPost(postFixture.id,true);await saveCommunityPost(postFixture.id,false);await recordCommunityVisit(postFixture.id);await clearCommunityHistory();
 assert.deepEqual(calls,[[`/api/social/me/library/saved/${postFixture.id}`,"PUT"],[`/api/social/me/library/saved/${postFixture.id}`,"DELETE"],[`/api/social/me/library/history/${postFixture.id}`,"PUT"],["/api/social/me/library/history","DELETE"]]);
});
