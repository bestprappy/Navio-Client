// Run against an isolated dev server configured with the test AUTH_SECRET below.
// Set NAVIO_PLAYWRIGHT_MODULE to an installed Playwright module when it is outside this client.
import assert from "node:assert/strict";
import { encode } from "next-auth/jwt";
import { groupFixture, postFixture } from "./data.ts";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin = "http://localhost:3107";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const cookie = await encode({ secret: "community-ui-test-secret-not-for-production", salt: "authjs.session-token",
  token: { sub: groupFixture.createdById, name: "Test Traveler", email: "traveler@example.com", accessToken: "ui-test-only", accessTokenExpiresAt: Math.floor(Date.now()/1000)+3600 } });
await context.addCookies([{ name:"authjs.session-token",value:cookie,url:origin,httpOnly:true,sameSite:"Lax" }]);
const page = await context.newPage();
const errors=[]; page.on("pageerror",error=>errors.push(error.message));
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
let group={...groupFixture,joined:true,role:"admin"};
let posts=[]; let comments=[]; let failNextUpload=true; let uploads=0;
let profile={id:"44444444-4444-4444-8444-444444444444",displayName:"Test Traveler",email:"traveler@example.com",status:"active",avatarMediaId:null,locale:"en",countryCode:"TH",roles:[],preferences:{language:"en",distanceUnit:"km",notificationEmail:true,notificationPush:false}};
const paged=(content)=>({content,number:0,totalElements:content.length,totalPages:content.length?1:0,last:true});
await context.route("**/api/groups**",async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  if(path.endsWith("/banner")) {
    if(req.method()==="DELETE") {group={...group,bannerMediaId:null,bannerUrl:null};return route.fulfill({status:204});}
    if(req.method()==="POST") { const form=await new Request(req.url(),{method:"POST",headers:req.headers(),body:req.postDataBuffer()}).formData(); assert.deepEqual(Buffer.from(await form.get("file").arrayBuffer()),png); group={...group,bannerMediaId:postFixture.id,bannerUrl:"/v1/groups/test/banner"}; return route.fulfill({json:group}); }
    return route.fulfill({contentType:"image/png",body:png});
  }
  if(path.endsWith("/profile")) { group={...group,...req.postDataJSON()};return route.fulfill({json:group}); }
  return route.fulfill({json:["/api/groups","/api/groups/mine","/api/groups/search"].includes(path)?paged([group]):group});
});
await context.route("**/api/posts**",async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  if(path.endsWith("/image")) return route.fulfill({contentType:"image/png",body:png});
  if(path==="/api/posts" && req.method()==="POST") {
    const form=await new Request(req.url(),{method:"POST",headers:req.headers(),body:req.postDataBuffer()}).formData();
    assert.deepEqual(Buffer.from(await form.get("file").arrayBuffer()),png);uploads++;
    if(failNextUpload){failNextUpload=false;return route.fulfill({status:503,json:{message:"Storage unavailable"}});}
    const body=JSON.parse(await form.get("post").text());posts=[{...postFixture,...body,imageUrl:`/v1/posts/${postFixture.id}/image`}];group.postCount=1;
    return route.fulfill({status:201,json:posts[0]});
  }
  if(path.endsWith("/comments")) {
    if(req.method()==="POST"){const body=req.postDataJSON();const id=`55555555-5555-4555-8555-${String(comments.length+1).padStart(12,"0")}`;comments.push({...body,id,postId:postFixture.id,authorId:groupFixture.createdById,createdAt:postFixture.createdAt,deleted:false,upvotes:0,viewerVote:0});posts[0].commentCount=comments.length;return route.fulfill({status:201,json:comments.at(-1)});}
    return route.fulfill({json:paged(comments)});
  }
  if(path.endsWith("/vote")){posts[0]={...posts[0],viewerVote:req.postDataJSON().value,upvotes:req.postDataJSON().value};return route.fulfill({json:posts[0]});}
  if(req.method()==="PATCH"){posts[0]={...posts[0],...req.postDataJSON()};return route.fulfill({json:posts[0]});}
  if(req.method()==="DELETE"){posts=[];return route.fulfill({status:204});}
  return route.fulfill({json:path==="/api/posts"?paged(posts):posts[0]});
});
await context.route("**/api/users/**",async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  if(path.endsWith("/picture")){
    if(req.method()==="POST"){const form=await new Request(req.url(),{method:"POST",headers:req.headers(),body:req.postDataBuffer()}).formData();assert.deepEqual(Buffer.from(await form.get("file").arrayBuffer()),png);profile={...profile,avatarMediaId:postFixture.id};return route.fulfill({status:201,json:profile});}
    if(req.method()==="DELETE"){profile={...profile,avatarMediaId:null};return route.fulfill({status:204});}
    return route.fulfill({contentType:"image/png",body:png});
  }
  return route.fulfill({json:path.includes("by-subject")?{...profile,memberSince:postFixture.createdAt}:profile});
});
try {
  await page.goto(`${origin}/community/create?groupId=${group.id}&groupSlug=${group.slug}`);
  await page.getByRole("heading",{name:"Create post",exact:true}).waitFor({timeout:90000});
  await page.getByLabel("Title",{exact:true}).fill("Browser-tested route");
  await page.getByLabel("Post text",{exact:true}).fill("A real discussion flow <script>window.injected=true</script>");
  await page.getByLabel("Post banner picture (optional)").setInputFiles({name:"route.png",mimeType:"image/png",buffer:png});
  await page.getByRole("button",{name:"Publish post",exact:true}).click();
  await page.getByText("Communities are temporarily unavailable. Please try again.",{exact:true}).waitFor();
  assert.equal(await page.getByLabel("Title",{exact:true}).inputValue(),"Browser-tested route");
  await page.getByRole("button",{name:"Publish post",exact:true}).click();
  await page.getByRole("heading",{name:"Browser-tested route",exact:true}).waitFor({timeout:90000});
  await page.reload();await page.getByRole("heading",{name:"Browser-tested route",exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.injected),undefined);
  await page.getByRole("button",{name:"Upvote",exact:true}).first().click();
  await page.waitForFunction(()=>document.querySelector('[aria-label="Upvote"]')?.getAttribute("aria-pressed")==="true");
  await page.getByLabel("Add a comment",{exact:true}).fill("Useful route notes");
  await page.getByRole("button",{name:"Post comment",exact:true}).click();
  await page.getByText("Useful route notes",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Reply",exact:true}).click();
  await page.getByLabel("Your reply",{exact:true}).fill("Thanks for the suggestion");
  await page.getByRole("button",{name:"Post reply",exact:true}).click();
  await page.getByText("Thanks for the suggestion",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Edit",exact:true}).click();
  await page.getByRole("dialog").getByLabel("Title",{exact:true}).fill("Updated route");
  await page.getByRole("button",{name:"Save changes",exact:true}).click();
  await page.getByRole("heading",{name:"Updated route",exact:true}).waitFor();
  for(const width of [390,768,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`overflow at ${width}`);}
  await page.emulateMedia({colorScheme:"dark"});await page.screenshot({path:process.env.NAVIO_SCREENSHOT_PATH ?? "../server/community-service/target/community-mobile.png",fullPage:true});
  await page.goto(`${origin}/community/${group.slug}`);
  await page.getByRole("button",{name:"Manage community",exact:true}).click();
  await page.getByLabel("Community banner",{exact:true}).setInputFiles({name:"banner.png",mimeType:"image/png",buffer:png});
  await page.getByRole("button",{name:"Upload banner",exact:true}).click();
  await page.getByText("Banner updated.",{exact:true}).waitFor();
  assert.equal(group.bannerMediaId,postFixture.id);
  await page.getByRole("button",{name:"Remove banner",exact:true}).click();
  await page.getByRole("img",{name:"Current community banner",exact:true}).waitFor({state:"hidden"});
  assert.equal(group.bannerMediaId,null);
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({state:"hidden"});
  await page.goto(`${origin}/settings/profile`);
  await page.getByLabel("Profile picture",{exact:true}).setInputFiles({name:"avatar.png",mimeType:"image/png",buffer:png});
  await page.getByRole("button",{name:"Upload picture",exact:true}).click();
  await page.getByText("Profile picture updated.",{exact:true}).waitFor();
  assert.equal(profile.avatarMediaId,postFixture.id);
  await page.getByRole("button",{name:"Remove picture",exact:true}).click();
  await page.getByRole("button",{name:"Remove picture",exact:true}).waitFor({state:"hidden"});
  assert.equal(profile.avatarMediaId,null);
  await page.goto(`${origin}/community/${group.slug}/${postFixture.id}`);
  await page.getByRole("button",{name:"Delete",exact:true}).first().click();
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  assert.equal(posts.length,1);
  await page.getByRole("button",{name:"Delete",exact:true}).first().click();
  await page.getByRole("button",{name:"Delete post",exact:true}).click();
  await page.getByRole("heading",{name:"No discussions yet",exact:true}).waitFor();
  assert.equal(posts.length,0);
  assert.equal(uploads,2);assert.deepEqual(errors,[]);
  console.log("Browser checks passed: upload failure/retry, publish/reload, escaped text, votes, comment/reply, edit/delete, responsive layouts, banner upload/removal, Escape focus management, profile upload/removal.");
} finally {await browser.close();}
