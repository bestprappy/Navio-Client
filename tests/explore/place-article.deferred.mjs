// [DEFERRED][EXCLUDE_FROM_REPORT] PLACES_EDITORIAL - disabled by user on 2026-10-22.
// Future work only. See Navio/docs/deferred/places-editorial.md before restoring.
// BEGIN DEFERRED IMPLEMENTATION
// import assert from "node:assert/strict";
// import { register } from "node:module";
// import { beforeEach, test } from "node:test";
// import React from "react";
// import { renderToStaticMarkup } from "react-dom/server";
// // Editorial fixtures have review dates; keep rendering tests independent of wall-clock expiry.
// beforeEach(context => context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-22T12:00:00Z") }));
// register(new URL("../support/typescript-loader.mjs", import.meta.url));
// const { PlaceArticle } = await import("../../app/feature/explore/places/place-article.tsx");
// const { discoveryItemSchema } = await import("../../app/feature/explore/places/places-api.ts");
// function render(description, id = "ChIJPzZsMU6Z4jARQUzvk913bCo", businessStatus) {
//   return renderToStaticMarkup(React.createElement(PlaceArticle, { item: discoveryItemSchema.parse({place: {providerPlaceId:id,name:"The Grand Palace",location:{lat:13.75,lng:100.49},description},businessStatus,photos:[{url:"https://example.com/one.jpg",attributions:[{displayName:"Photo author"}]}]}) }));
// }
//
// test("a short Google sentence cannot override a prepared original article", () => {
//   const html = render("A short Google description.");
//   assert.match(html, /Navio editorial/);
//   assert.match(html, /1782/);
//   assert.doesNotMatch(html, /A short Google description|From Google Maps/);
// });
// test("opening is readable before expansion and the story has sources, photo credits and no duplicate logo", () => {
//   const html = render(null);
//   assert.match(html, /Read the story/);
//   assert.match(html, /Show less/);
//   assert.match(html, /<details/);
//   assert.doesNotMatch(html, /<details[^>]* open/);
//   assert.match(html, /royalgrandpalace.th/);
//   assert.match(html, /Photo author/);
//   assert.doesNotMatch(html, /alt="Google Maps"|may be inaccurate|not ready yet/);
//   assert.ok(html.indexOf("1782") < html.indexOf("<details"));
// });
// test("unknown places omit the whole section even when Google has a summary", () => {
//   assert.equal(render("Google description", "unprepared-place"), "");
//   assert.equal(render(null, "constructor"), "");
//   assert.equal(render(null, "ChIJPzZsMU6Z4jARQUzvk913bCo", "CLOSED_PERMANENTLY"), "");
//   assert.equal(render(null, "ChIJPzZsMU6Z4jARQUzvk913bCo", "CLOSED_TEMPORARILY"), "");
// });
// test("publication gates reject missing evidence, drafts, wrong identity, excess length and stale reviews", async () => {
//   const { articleIssues, articleWordCount } = await import("../../app/feature/explore/places/place-article-model.ts");
//   const { placeArticles } = await import("../../app/feature/explore/places/place-articles.data.ts");
//   const id="ChIJPzZsMU6Z4jARQUzvk913bCo";
//   const now=new Date("2026-10-22T12:00:00Z");
//   for(const [key,article] of Object.entries(placeArticles)) {
//     assert.deepEqual(articleIssues(article,key,now),[],key);
//     assert.ok(articleWordCount(article)>=250 && articleWordCount(article)<=500);
//   }
//   const a=placeArticles[id];
//   assert.ok(articleIssues({...a,sources:a.sources.map(s=>({...s,authority:false}))},id,now).includes("source-coverage"));
//   assert.ok(articleIssues({...a,sources:a.sources.map(s=>({...s,url:"javascript:alert(1)"}))},id,now).includes("sources"));
//   assert.ok(articleIssues({...a,status:"draft"},id,now).includes("not-published"));
//   assert.ok(articleIssues({...a,placeId:"wrong"},id,now).includes("identity"));
//   assert.ok(articleIssues({...a,reviewDueOn:"2026-10-21"},id,now).includes("review-due"));
//   assert.ok(articleIssues({...a,reviewedOn:"2026-10-23"},id,now).includes("review-date"));
//   assert.ok(articleIssues({...a,sources:a.sources.slice(0,1)},id,now).includes("source-coverage"));
//   assert.ok(articleIssues({...a,sources:a.sources.map(s=>({...s,publisher:"one"}))},id,now).includes("source-coverage"));
//   assert.ok(articleIssues({...a,introduction:{...a.introduction,sourceIds:["missing"]}},id,now).includes("citations"));
//   assert.ok(articleIssues({...a,sections:a.sections.filter(s=>s.kind!=="experience")},id,now).includes("experiences"));
//   assert.ok(articleIssues({...a,introduction:{...a.introduction,text:"padding ".repeat(501)}},id,now).includes("word-budget"));
// });
//
// test("review expiry follows Bangkok midnight and supplies the rollover delay", async () => {
//   const { articleIssues, millisecondsUntilEditorialRollover } = await import("../../app/feature/explore/places/place-article-model.ts");
//   const { placeArticles } = await import("../../app/feature/explore/places/place-articles.data.ts");
//   const id="ChIJPzZsMU6Z4jARQUzvk913bCo";
//   const now=new Date("2026-10-22T16:59:59.000Z");
//   assert.equal(millisecondsUntilEditorialRollover(now),1000);
//   const article={...placeArticles[id],reviewDueOn:"2026-10-23"};
//   assert.deepEqual(articleIssues(article,id,now),[]);
//   assert.ok(articleIssues(article,id,new Date(now.getTime()+1000)).includes("review-due"));
// });
// END DEFERRED IMPLEMENTATION
