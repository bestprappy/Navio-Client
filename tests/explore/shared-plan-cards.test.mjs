import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import { stat } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup as renderMarkup } from "react-dom/server";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {SessionProvider} from "next-auth/react";
function renderToStaticMarkup(element){return renderMarkup(React.createElement(SessionProvider,{session:null},React.createElement(QueryClientProvider,{client:new QueryClient()},element)));}
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { explorePlanSchema } = await import("../../app/feature/explore/_components/shared-plans/explore-plans-api.ts");
const { SharedPlanCard } = await import("../../app/feature/explore/_components/shared-plans/shared-plan-card.tsx");
const raw={token:"public",title:"A quieter Bangkok",destinationCity:"Bangkok",destinationCountry:"Thailand",dayCount:3,placeCount:8,chargerCount:1,highlights:["Wat Pho","Wat Arun"],days:[{stops:["place","charger"]}],viewCount:1250,copyCount:12,coverPlaceId:"GOOGLE:ChIJgcxFcQWZ4jARLsIR9Qia9H0"};
test("photo replacement retains the loaded image until its matching new credits can be displayed",async()=>{
 const {livePhotoLayers}=await import("../../app/feature/explore/_components/shared-plans/plan-cover.tsx");
 assert.deepEqual(livePhotoLayers("new-photo","old-photo"),{previous:"old-photo",currentVisible:false});
 assert.deepEqual(livePhotoLayers("new-photo","new-photo"),{previous:null,currentVisible:true});
 assert.deepEqual(livePhotoLayers("new-photo",null),{previous:null,currentVisible:false});
 assert.deepEqual(livePhotoLayers(undefined,"old-photo"),{previous:"old-photo",currentVisible:false});
});
test("older feeds render a bundled matching photo immediately without a provider request",()=>{
 const plan=explorePlanSchema.parse({...raw,destinationCity:"Sydney",destinationCountry:"Australia",coverPlaceId:undefined});
 const html=renderToStaticMarkup(React.createElement(SharedPlanCard,{plan}));
 assert.match(html,/src="\/images\/plan-covers\/sydney\.webp"/);
 assert.match(html,/Sydney Opera House/);
 assert.match(html,/commons.wikimedia.org/);
 assert.doesNotMatch(html,/loading="lazy"/);
});
test("every catalog cover is a bundled real image with credit and license, without cross-country city matching",async()=>{
 const {PLAN_DESTINATION_COVERS,destinationPlanCover}=await import("../../app/feature/explore/_components/shared-plans/plan-cover.data.ts");
 assert.equal(PLAN_DESTINATION_COVERS.length,30);
 for(const cover of PLAN_DESTINATION_COVERS){
  assert.ok((await stat(new URL(`../../public${cover.src}`,import.meta.url))).size>1000);
  assert.match(cover.sourceUrl,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert.ok(cover.author && cover.license && cover.licenseUrl);
  assert.equal(destinationPlanCover({destinationCity:cover.city,destinationCountry:cover.country,highlights:[]}),cover);
 }
 assert.equal(destinationPlanCover({destinationCity:"Taipei City",destinationCountry:"Taiwan",highlights:[]})?.city,"Taipei");
 assert.equal(destinationPlanCover({destinationCity:"Sydney",destinationCountry:"Canada",highlights:[]}),undefined);
 assert.equal(destinationPlanCover({destinationCity:"Unknown",destinationCountry:"",highlights:[]}),undefined);
});
test("compact plan card states duration, stops and genuine engagement with an honest unrated state",()=>{
 const html=renderToStaticMarkup(React.createElement(SharedPlanCard,{plan:explorePlanSchema.parse(raw)}));
 assert.match(html,/3 days/);assert.match(html,/8 places/);assert.match(html,/1.3K views|1.2K views/);
 assert.match(html,/12 copies/);assert.match(html,/Not rated yet/);
 assert.match(html,/A quieter Bangkok/);assert.match(html,/Wat Pho/);
});
test("missing engagement from an older backend is unavailable, not invented zero activity",()=>{
 const html=renderToStaticMarkup(React.createElement(SharedPlanCard,{plan:explorePlanSchema.parse({...raw,viewCount:undefined,copyCount:undefined})}));
 assert.match(html,/Views unavailable/);assert.match(html,/Copy count unavailable/);
});

const { SharedPlansSection }=await import("../../app/feature/explore/_components/shared-plans/shared-plans-section.tsx");
const { TRENDING_PAGE_SIZE }=await import("../../app/feature/explore/_components/shared-plans/explore-plans-api.ts");
const { planCoverReference }=await import("../../app/feature/explore/_components/shared-plans/plan-cover.tsx");
const { PlanEngagement }=await import("../../app/feature/explore/_components/shared-plans/plan-engagement.tsx");
test("Trending renders six real cards and a load-more control",()=>{
 const plans=Array.from({length:6},(_,index)=>explorePlanSchema.parse({...raw,token:`plan-${index}`}));
 const html=renderToStaticMarkup(React.createElement(SharedPlansSection,{kind:"trending",plans,total:31,isLoading:false,isError:false,isFetchingMore:false,hasMore:true,loadMoreFailed:false,onLoadMore(){},onRetry(){}}));
 assert.equal(TRENDING_PAGE_SIZE,6);
 assert.equal((html.match(/<article/g)??[]).length,6);
 assert.match(html,/Load more trending plans/);
 assert.match(html,/Trending plans/);
});
test("cover lookup accepts only a Google reference and rejects URLs or other providers",()=>{
 assert.equal(planCoverReference(raw.coverPlaceId),"ChIJgcxFcQWZ4jARLsIR9Qia9H0");
 assert.equal(planCoverReference("MAPBOX:ChIJgcxFcQWZ4jARLsIR9Qia9H0"),null);
 assert.equal(planCoverReference("https://example.com/image"),null);
 assert.equal(planCoverReference(undefined),null);
});
test("detail distinguishes successful copies from distinct travelers",()=>{
 const html=renderToStaticMarkup(React.createElement(PlanEngagement,{copyCount:8,uniqueCopierCount:3,viewCount:12,detail:true}));
 assert.match(html,/8 copies/);assert.match(html,/3 travelers/);
});

test("public detail reads only valid aggregate counts and drops engagement for unlisted links", async()=>{
 const {readSharedPlanResponse}=await import("../../app/feature/planner/_components/share/publication-api.ts");
 const response={plan:{sanitizerVersion:1,dayCount:1,days:[]},listedInExplore:true,engagement:{viewCount:12,copyCount:8,uniqueCopierCount:3,privateCopierIds:["never public"]}};
 assert.deepEqual(readSharedPlanResponse(response).engagement,{viewCount:12,copyCount:8,uniqueCopierCount:3});
 assert.equal(readSharedPlanResponse({...response,listedInExplore:false}).engagement,undefined);
 assert.equal(readSharedPlanResponse({...response,engagement:{copyCount:-1}}).engagement.copyCount,undefined);
});


test("published plan cards expose Share then Save beside the author in every layout",()=>{
 for(const layout of ["tile","row","planner"]){
  const html=renderToStaticMarkup(React.createElement(SharedPlanCard,{plan:explorePlanSchema.parse({...raw,authorName:"Navio Team"}),layout}));
  const author=html.indexOf("Shared by");const share=html.indexOf('aria-label="Share plan"');const save=html.indexOf('aria-label="Save plan"');
  assert.ok(author>=0 && share>author && save>share,"author, Share, Save appear in that order");
  assert.match(html,/aria-label="Plan actions"/);assert.match(html,/relative z-10/);
  assert.doesNotMatch(html,/<a[^>]*>[^<]*<button/);
 }
});
