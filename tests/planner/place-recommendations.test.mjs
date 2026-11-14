import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";

register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { buildPlaceRecommendations, canonicalPlaceId, describeRecommendation } = await import("../../app/feature/planner/planId/_components/place/place-recommendations.ts");
const { recommendationCategory } = await import("../../app/feature/planner/planId/_components/place/place-recommendation-category.ts");
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

const typed=(id,primaryType,lat=13.75,lng=100.5)=>({...place(id,id,lat,lng),primaryType});
const guideOf=(...sections)=>({...guide,sections:sections.map(([id,places])=>({id,title:id,colorId:"blue",places}))});
const stop=(name,placeType,lat=13.75,lng=100.5)=>({placeId:`GOOGLE:stop-${name}`,name,lat,lng,placeType});
const context=(over={})=>({dayStops:[],plannedIds:new Set(),dayIndex:0,...over});
const ids=items=>items.map(i=>i.place.id.slice(7));

test("places already planned anywhere in the trip are never suggested, even with traveler evidence",()=>{
  const items=buildPlaceRecommendations(destination,[guide],{minimumTravelers:5,items:[count("a",9)]},6,context({plannedIds:new Set(["GOOGLE:a"])}));
  assert.deepEqual(ids(items),["c","b"]);
});
test("days with the same destination open on different guide picks",()=>{
  const many=guideOf(["visit",Array.from({length:8},(_,i)=>typed(`p${i}`,"museum",13.75+i*0.01))]);
  const first=ids(buildPlaceRecommendations(destination,[many],undefined,3,context({dayIndex:0})));
  const second=ids(buildPlaceRecommendations(destination,[many],undefined,3,context({dayIndex:1})));
  assert.deepEqual(first,["p0","p1","p2"]);
  assert.deepEqual(second,["p3","p4","p5"]);
});
test("a guide pick beside the day's stops outranks a higher-listed one across the city and says why",()=>{
  const g=guideOf(["visit",[typed("across","museum",13.85,100.5),typed("beside","museum",13.751,100.501)]]);
  const items=buildPlaceRecommendations(destination,[g],undefined,6,context({dayStops:[stop("Wat Pho","buddhist_temple",13.7505,100.5005)]}));
  assert.deepEqual(ids(items),["beside","across"]);
  assert.equal(describeRecommendation(items[0].reason),"Near Wat Pho");
  assert.equal(describeRecommendation(items[1].reason),"Navio pick");
});
test("a day of sights is offered a meal first",()=>{
  const g=guideOf(["visit",[typed("v1","museum"),typed("v2","museum",13.76),typed("v3","museum",13.77)]],["eat",[typed("e1","thai_restaurant",13.74)]]);
  const items=buildPlaceRecommendations(destination,[g],undefined,6,context({dayStops:[stop("Temple","buddhist_temple",13.78,100.55)]}));
  assert.equal(ids(items)[0],"e1");
  assert.equal(describeRecommendation(items[0].reason),"Adds a meal");
});
test("one kind of place cannot fill the shelf while another kind is available",()=>{
  const g=guideOf(["visit",[typed("t1","buddhist_temple"),typed("t2","buddhist_temple",13.76),typed("t3","buddhist_temple",13.77),typed("park","park",13.78)]]);
  assert.deepEqual(ids(buildPlaceRecommendations(destination,[g],undefined,3)),["t1","t2","park"]);
});
test("places to stay are suggested after places to visit",()=>{
  const g=guideOf(["stay",[typed("hotel","lodging")]],["visit",[typed("v1","museum",13.76),typed("v2","museum",13.77)]]);
  assert.equal(ids(buildPlaceRecommendations(destination,[g]))[0],"v1");
});
test("stops in another city do not steer this destination's shelf",()=>{
  const away=context({dayStops:[stop("Tokyo lunch","ramen_restaurant",35.7,139.7)]});
  const items=buildPlaceRecommendations(destination,[guide],undefined,6,away);
  assert.deepEqual(ids(items),ids(buildPlaceRecommendations(destination,[guide])));
  assert.ok(items.every(i=>i.reason.kind==="pick"));
});
test("an empty shelf is returned for a zero limit",()=>{
  assert.deepEqual(buildPlaceRecommendations(destination,[guide],undefined,0),[]);
});
test("every reason reads as a short card line",()=>{
  assert.equal(describeRecommendation({kind:"popular",travelers:12}),"Chosen by 12 travelers");
  assert.equal(describeRecommendation({kind:"gap",category:"nature"}),"Adds time outdoors");
  assert.equal(describeRecommendation({kind:"pick"}),"Navio pick");
});
test("provider types and guide sections map to coarse kinds of stop",()=>{
  const cases=[["thai_restaurant","food"],["coffee_shop","food"],["ice_cream_shop","food"],["buddhist_temple","sight"],
    ["national_park","nature"],["amusement_park","sight"],["bed_and_breakfast","stay"],["resort_hotel","stay"],
    ["night_market","shopping"],["wine_bar","nightlife"],["parking",""],["subway_station",""],["street_address",""]];
  for(const [type,expected] of cases) assert.equal(recommendationCategory(type),expected||null,type);
  assert.equal(recommendationCategory(undefined,"eat"),"food");
  assert.equal(recommendationCategory(undefined,"visit"),"sight");
  assert.equal(recommendationCategory(undefined,undefined),null);
});
