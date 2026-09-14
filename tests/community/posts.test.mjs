import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";
import { postFixture } from "./data.ts";

registerHooks({ resolve(specifier, context, next) {
  if (specifier === "./community-api") return next(`${specifier}.ts`,context);
  return next(specifier,context);
} });
const { createPost, getDeletedPostId, isDeletedPostQuery, listPosts, postSchema, postFormSchema } = await import("../../app/feature/community/_components/community-post-api.ts");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("post creation sends one multipart operation with unchanged file bytes",async () => {
  const bytes = new Uint8Array([0,255,128,65,13,10]);
  globalThis.fetch = async (url,options) => {
    assert.equal(url,"/api/posts");
    assert.equal(options.headers["Content-Type"],undefined);
    assert.ok(options.body instanceof FormData);
    assert.deepEqual(new Uint8Array(await options.body.get("file").arrayBuffer()),bytes);
    const post = JSON.parse(await options.body.get("post").text());
    assert.equal(post.title,"Title"); assert.equal(post.groupSlug,"trips"); assert.equal(post.linkUrl,null);
    return Response.json(postFixture,{status:201});
  };
  const post = await createPost("trips",{title:" Title ",body:"Text",linkUrl:""},null,null,new File([bytes],"picture.png",{type:"image/png"}));
  assert.equal(post.id,postFixture.id);
});

test("post links and returned image sources reject executable URLs",() => {
  for (const linkUrl of ["javascript:alert(1)","data:text/html,<script>x</script>","//evil.example"]) {
    assert.equal(postFormSchema.safeParse({title:"Title",body:"",linkUrl}).success,false);
    assert.equal(postSchema.safeParse({...postFixture,linkUrl}).success,false);
  }
  assert.equal(postSchema.safeParse({...postFixture,imageUrl:"https://evil.example/tracker"}).success,false);
});

test("post search paginates on the server without depending on loaded groups",async () => {
  globalThis.fetch = async (url) => {
    const parsed = new URL(url,"http://navio.test");
    assert.equal(parsed.searchParams.get("q"),"EV & food");
    assert.equal(parsed.searchParams.get("page"),"2"); assert.equal(parsed.searchParams.get("group"),null);
    return Response.json({content:[postFixture],number:2,totalElements:41,totalPages:3,last:true});
  };
  assert.equal((await listPosts("EV & food","new",2)).content[0].title,"Route notes");
});

test("null and malformed post responses are rejected",() => {
  assert.equal(postSchema.safeParse(null).success,false);
  assert.equal(postSchema.safeParse({...postFixture,commentCount:-1}).success,false);
  assert.equal(postSchema.safeParse({...postFixture,viewerVote:5}).success,false);
});

test("only a post delete is recognised as removing a post",() => {
  const id = postFixture.id;
  assert.equal(getDeletedPostId({path:`/${id}`,method:"DELETE"}),id);
  assert.equal(getDeletedPostId({path:`/${id}`,method:"PATCH"}),null);
  assert.equal(getDeletedPostId({path:`/${id}/comments/${id}`,method:"DELETE"}),null);
  assert.equal(getDeletedPostId({path:`/${id}/vote`,method:"PUT"}),null);
});

test("deleting a post still refreshes feeds but skips the deleted post and its comments",() => {
  const id = postFixture.id;
  assert.equal(isDeletedPostQuery(["community","user","post",id],id),true);
  assert.equal(isDeletedPostQuery(["community","user","comments",id],id),true);
  assert.equal(isDeletedPostQuery(["community","user","posts","","new","all"],id),false);
  assert.equal(isDeletedPostQuery(["community","user","post","other"],id),false);
  assert.equal(isDeletedPostQuery(["community","user","post",id],null),false);
});

test("managed image URLs are mapped to the authenticated same-origin proxy",() => {
  assert.equal(postSchema.parse({...postFixture,imageUrl:`/v1/posts/${postFixture.id}/image`}).imageUrl,`/api/posts/${postFixture.id}/image`);
});
