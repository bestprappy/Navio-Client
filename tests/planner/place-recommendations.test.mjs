import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";

register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { buildPlaceRecommendations, canonicalPlaceId } = await import("../../app/feature/planner/planId/_components/place/place-recommendations.ts");
const { placeRecommendationsSchema } = await import("../../lib/place-popularity-api.ts");
const { isPublicPlannerRequest } = await import("../../app/api/_lib/public-planner-request.ts");

const destination={ id:"bangkok",name:"Bangkok",lat:13.75,lng:100.5 };
const place=(id,name=id,lat=13.75,lng=100.5)=>({id:`GOOGLE:${id}`,provider:"GOOGLE",providerPlaceId:id,name,address:"Bangkok",lat,lng,blurb:"",tags:[]});
const guide={id:"guide",name:"Bangkok",country:"Thailand",description:"",destinationPlaceIds:["bangkok"],aliases:["bangkok"],coverPlaceId:"a",
  sections:[{id:"visit",title:"Visit",colorId:"blue",places:[place("a"),place("b"),place("a"),place("far","Tokyo",35.7,139.7)]},
    {id:"eat",title:"Eat",colorId:"amber",places:[place("c")]}]};
const count=(id,travelers,known=null)=>({placeId:`GOOGLE:${id}`,travelerCount:travelers,place:known});

test("curated fallback is deduplicated, mixed by category and bounded to the destination",()=>{
  const items=buildPlaceRecommendations(destination,[guide]);
  assert.deepEqual(items.map(i=>i.place.id),["GOOGLE:a","GOOGLE:c","GOOGLE:b"]);
  assert.ok(items.every(i=>i.travelerCount===undefined));
});
test("distinct traveler evidence orders candidates ahead of editorial picks without inventing votes",()=>{
  const items=buildPlaceRecommendations(destination,[guide],{minimumTravelers:5,items:[count("a",5),count("b",8)]});
  assert.deepEqual(items.map(i=>[i.place.id,i.travelerCount]),[["GOOGLE:b",8],["GOOGLE:a",5],["GOOGLE:c",undefined]]);
});
test("a popular place from a public plan works without a destination guide",()=>{
  const items=buildPlaceRecommendations(destination,[],{minimumTravelers:5,items:[count("public",7,{name:"Public market",address:"Bangkok",lat:13.7,lng:100.5,primaryType:"market",imageUrl:null})]});
  assert.equal(items[0].place.name,"Public market"); assert.equal(items[0].travelerCount,7);
});
test("unknown private place metadata never becomes a made-up suggestion",()=>{
  assert.deepEqual(buildPlaceRecommendations(destination,[],{minimumTravelers:5,items:[count("private",7)]}),[]);
});
test("subthreshold counts remain curated picks without a popularity claim",()=>{
  const items=buildPlaceRecommendations(destination,[guide],{minimumTravelers:5,items:[count("a",4)]});
  assert.ok(items.every(i=>i.travelerCount===undefined));
});
test("equal counts use deterministic place identity ordering and the output is bounded",()=>{
  const items=buildPlaceRecommendations(destination,[guide],{minimumTravelers:5,items:[count("b",5),count("a",5)]},2);
  assert.deepEqual(items.map(i=>i.place.id),["GOOGLE:a","GOOGLE:b"]);
});
test("public candidates outside the destination cannot enter the shelf",()=>{
  assert.deepEqual(buildPlaceRecommendations(destination,[],{minimumTravelers:5,items:[count("far",8,{name:"Tokyo",address:"Tokyo",lat:35.7,lng:139.7,primaryType:null,imageUrl:null})]}),[]);
});
test("legacy Google identities match the canonical provider namespace",()=>{
  assert.equal(canonicalPlaceId("ChIJlegacy"),"GOOGLE:ChIJlegacy");
  assert.equal(canonicalPlaceId("MAPBOX:legacy"),"MAPBOX:legacy");
  assert.equal(canonicalPlaceId("SAVED_LOCATION:home"),"SAVED_LOCATION:home");
});
test("API validation rejects exposed low counts, personal IDs and malformed public coordinates",()=>{
  const valid={minimumTravelers:5,items:[count("a",5)]};
  assert.ok(placeRecommendationsSchema.safeParse(valid).success);
  for(const item of [count("a",4),{...count("a",5),placeId:"SAVED_LOCATION:home"},count("a",5,{name:"Bad",address:"",lat:91,lng:100,primaryType:null,imageUrl:null})])
    assert.equal(placeRecommendationsSchema.safeParse({...valid,items:[item]}).success,false);
});
test("popularity reads and privacy writes never qualify for anonymous proxy access",()=>{
  for(const method of ["GET","PUT","POST","PATCH","DELETE"])
    for(const path of ["/v1/trips/place-popularity/preferences","/v1/trips/11111111-1111-4111-8111-111111111111/place-recommendations?lat=13.75&lng=100.5"])
      assert.equal(isPublicPlannerRequest(method,path),false);
});
