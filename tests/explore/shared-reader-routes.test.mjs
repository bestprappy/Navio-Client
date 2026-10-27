import assert from "node:assert/strict";
import {register} from "node:module";
import {test} from "node:test";
register(new URL("../support/typescript-loader.mjs",import.meta.url));
const {buildReaderModel}=await import("../../app/feature/planner/_components/share/reader/reader-model.ts");
const {readerRouteLegs,readerRouteGroups}=await import("../../app/feature/planner/_components/share/reader/reader-route-model.ts");
const shared={plan:{sanitizerVersion:1,dayCount:2,days:[{label:"Day 1",startsAt:{name:"Private start location",redacted:true},items:[{type:"place",name:"A",lat:13,lng:100},{type:"note",noteContent:"Note"},{type:"place",name:"B",lat:13.01,lng:100.01,arrivalMode:"walk"},{type:"place",name:"Missing"},{type:"place",name:"C",lat:13.02,lng:100.02},{type:"charger",name:"D",lat:13.03,lng:100.03,arrivalMode:"transit",arrivalRouteKey:'v1:[["SUBWAY","Blue","B","C","D"]]'}]},{label:"Day 2",items:[{type:"place",name:"E",lat:14,lng:101}]}]},authorName:null,listedInExplore:true,publishedAt:"2026-10-27"};
test("shared routes contain only adjacent located public stops, never anchor, missing-stop or cross-day legs",()=>{
 const model=buildReaderModel(shared);const legs=readerRouteLegs(model.groups);
 assert.deepEqual(legs.map(leg=>[leg.from.item.name,leg.to.item.name]),[["A","B"],["C","D"]]);
 assert.equal(readerRouteGroups(legs,{}).length,2);
});
test("owner modes/transit selection survive route requests, while comparison overrides never mutate the publication",()=>{
 const before=structuredClone(shared);const legs=readerRouteLegs(buildReaderModel(shared).groups);
 const original=readerRouteGroups(legs,{});
 assert.equal(original[0].points[1].arrivalMode,"walk");assert.match(original[1].points[1].arrivalRouteKey,/Blue/);
 const compared=readerRouteGroups(legs,{[legs[1].id]:"bike"});
 assert.equal(compared[1].points[1].arrivalMode,"bike");assert.equal(compared[1].points[1].arrivalRouteKey,undefined);
 assert.deepEqual(shared,before);
});
test("invalid or absent historical modes are suggestions, not claims of the author's choice",()=>{
 const model=buildReaderModel({...shared,plan:{...shared.plan,days:[{label:"Day 1",items:[{type:"place",name:"A",lat:13,lng:100},{type:"place",name:"B",lat:13.1,lng:100.1,arrivalMode:"nonsense",arrivalRouteKey:"private"}]}]}});
 const legs=readerRouteLegs(model.groups);assert.equal(legs[0].plannedMode,null);
 const group=readerRouteGroups(legs,{})[0];assert.equal(group.points[1].arrivalMode,"drive");assert.equal(group.points[1].arrivalRouteKey,undefined);
});
