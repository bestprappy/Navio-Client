import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { buildReaderModel, initialReaderSelection, reduceReaderSelection, rankRelatedPlans, readerDateLabel, groupReaderMarkers } = await import("../../app/feature/planner/_components/share/reader/reader-model.ts");
const shared={plan:{sanitizerVersion:1,dayCount:2,destinationCity:"Sydney",destinationCountry:"Australia",days:[
 {label:"Day 1",items:[{type:"note",noteContent:"Owner advice"},{type:"place",placeId:"GOOGLE:repeat",name:"Harbour",lat:-33.85,lng:151.21},{type:"charger",name:"Charge",lat:-33.86,lng:151.22}]},
 {label:"Day 2",items:[{type:"place",placeId:"GOOGLE:repeat",name:"Harbour",lat:-33.85,lng:151.21},{type:"place",name:"Unlocated"},{type:"checklist",checklistLabels:["Water"]}]}]},publishedAt:"2026-10-26",listedInExplore:true,authorName:"Owner"};

test("the publication reader retains the owner's published palette choice",()=>{
 const input=structuredClone(shared);input.plan.days[0].colorId="custom-ocean";input.plan.days[1].colorId="rose";
 const model=buildReaderModel(input);
 assert.equal(model.days[0].colorId,"custom-ocean");assert.equal(model.days[1].colorId,"rose");
});
test("hero credits occupy one separate footer after the photo and its overlay",async()=>{
 const {createElement}=await import("react");const {renderToStaticMarkup}=await import("react-dom/server");
 const {PlanCover}=await import("../../app/feature/explore/_components/shared-plans/plan-cover.tsx");
 const model=buildReaderModel(shared);
 const html=renderToStaticMarkup(createElement(PlanCover,{plan:model.coverPlan,creditLayout:"footer",imageClassName:"h-72"},createElement("h1",null,"Trip title")));
 assert.equal((html.match(/data-cover-credit=/g)??[]).length,1);
 assert.match(html,/data-cover-frame=/);assert.match(html,/Trip title/);
 assert.match(html,/<\/h1><\/div><div[^>]*data-cover-credit="footer"/);
});
test("reader preserves the published data, occurrence identity and honest stop counts",()=>{
 const before=structuredClone(shared);const model=buildReaderModel(shared);
 assert.deepEqual(shared,before);assert.equal(model.groups.length,2);
 assert.deepEqual(model.groups.map(g=>g.stops.length),[2,2]);
 assert.notEqual(model.groups[0].stops[0].id,model.groups[1].stops[0].id);
 assert.equal(model.groups[0].entries[0].item.noteContent,"Owner advice");
 assert.equal(model.coverPlan.destinationCity,"Sydney");
 assert.equal(groupReaderMarkers(model.groups).length,2);
 assert.equal(groupReaderMarkers(model.groups)[0].stops.length,2);
});
test("following a day changes its first stop without a camera command or reopening a dismissed panel",()=>{
 const model=buildReaderModel(shared);let state=initialReaderSelection(model.groups);
 const camera=state.camera;
 state=reduceReaderSelection(state,{type:"dismiss"},model.groups);
 state=reduceReaderSelection(state,{type:"follow",groupId:model.groups[1].id},model.groups);
 assert.equal(state.stopId,model.groups[1].stops[0].id);assert.equal(state.dismissed,true);assert.equal(state.camera,camera);
 state=reduceReaderSelection(state,{type:"step",direction:1},model.groups);
 assert.equal(state.stopId,model.groups[1].stops[1].id);assert.equal(state.dismissed,false);
 state=reduceReaderSelection(state,{type:"zoom"},model.groups);
 assert.equal(state.camera,camera,"unlocated stops must not issue camera commands");
});
test("empty groups, repeated IDs, boundaries and explicit zoom are safe",()=>{
 const model=buildReaderModel(shared);let state=initialReaderSelection(model.groups);
 state=reduceReaderSelection(state,{type:"step",direction:-1},model.groups);
 assert.equal(state.stopId,model.groups[0].stops[0].id);
 state=reduceReaderSelection(state,{type:"zoom"},model.groups);assert.notEqual(state.camera,null);
 state=reduceReaderSelection(state,{type:"follow",groupId:"missing"},model.groups);assert.equal(state.groupId,model.groups[0].id);
 assert.equal(initialReaderSelection([]).stopId,null);
 assert.equal(readerDateLabel(""),null);assert.equal(readerDateLabel("2026-99-99"),null);
 assert.match(readerDateLabel("2026-10-26"),/Oct 26/);
});
test("related plans exclude the current plan and unrelated filler, preferring city then country",()=>{
 const plans=[{token:"self",destinationCity:"Sydney",destinationCountry:"Australia",dayCount:2}, {token:"country",destinationCity:"Melbourne",destinationCountry:"Australia",dayCount:2}, {token:"other",destinationCity:"Paris",destinationCountry:"France",dayCount:2}, {token:"city",destinationCity:"Sydney",destinationCountry:"Australia",dayCount:3}];
 assert.deepEqual(rankRelatedPlans(plans,"self",shared.plan).map(p=>p.token),["city","country"]);
});
test("publication previews include catalogue cars by default, require custom decisions and keep lists private",async()=>{
 const {initialPublicationPreview,applyPublicationPreview,publicationPreviewReady}=await import("../../app/feature/planner/_components/share/reader/publication-preview-model.ts");
 const presentation={vehicles:[{id:"catalog",name:"Catalogue car",source:"catalog",connectors:[]},{id:"custom",name:"Custom car",source:"custom",connectors:[]}],lists:[{title:"Ideas",items:[]}]};
 const before=structuredClone(presentation);const draft=initialPublicationPreview(presentation);
 assert.equal(publicationPreviewReady(draft),false);
 assert.deepEqual(applyPublicationPreview(presentation,draft).vehicles.map(v=>v.id),["catalog"]);
 assert.deepEqual(applyPublicationPreview(presentation,draft).lists,[]);
 const approved={...draft,customDecisions:{custom:true},includedListIndexes:[0],excludedCatalogIds:["catalog"]};
 assert.equal(publicationPreviewReady(approved),true);
 assert.deepEqual(applyPublicationPreview(presentation,approved).vehicles.map(v=>v.id),["custom"]);
 assert.equal(applyPublicationPreview(presentation,approved).lists.length,1);
 assert.deepEqual(presentation,before,"publication exclusions never remove original trip vehicles or lists");
});
test("preview content is opt-in and never appears in an ordinary public snapshot",()=>{
 const model=buildReaderModel(shared);
 assert.deepEqual(model.lists,[]);assert.equal(model.presentation.vehicles,undefined);assert.equal(model.presentation.introduction,undefined);
 assert.equal(model.stops.length,4);
});
test("a copied snapshot adapter never loses an unlocated place or converts it to invented coordinates",()=>{
 const model=buildReaderModel(shared);const missing=model.groups[1].stops[1];
 assert.equal(missing.item.name,"Unlocated");assert.equal(missing.located,false);
 assert.equal(missing.item.lat,undefined);assert.equal(missing.item.lng,undefined);
});
test("selecting a marker from another day also updates the By date picker",async()=>{
 const {createStore}=await import("jotai");
 const {readerModelAtom,readerActionAtom,readerSingleDayAtom}=await import("../../app/feature/planner/_components/share/reader/reader-state.ts");
 const store=createStore();const model=buildReaderModel(shared);store.set(readerModelAtom,model);
 store.set(readerSingleDayAtom,model.days[0].id);
 store.set(readerActionAtom,{type:"select",stopId:model.days[1].stops[0].id});
 assert.equal(store.get(readerSingleDayAtom),model.days[1].id);
});
test("photo attribution remains a separate link instead of being nested in the map-selection button",async()=>{
 const {createElement}=await import("react");
 const {renderToStaticMarkup}=await import("react-dom/server");
 const {QueryClient,QueryClientProvider}=await import("@tanstack/react-query");
 const {ReaderStopPhoto}=await import("../../app/feature/planner/_components/share/reader/reader-ui.tsx");
 const client=new QueryClient();
 const html=renderToStaticMarkup(createElement(QueryClientProvider,{client},createElement(ReaderStopPhoto,{item:{type:"place",name:"Kyoto",imageUrl:"/images/plan-covers/kyoto.webp"},onSelect(){}})));
 const button=html.match(/<button[^>]*aria-label="View Kyoto on map"[^>]*>[\s\S]*?<\/button>/)?.[0];
 assert.ok(button);assert.doesNotMatch(button,/<a\b/);assert.match(html,/Photo credit/);assert.match(html,/commons.wikimedia.org/);
 client.clear();
});
