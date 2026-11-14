import assert from 'node:assert/strict';import {test} from 'node:test';import {register} from 'node:module';register(new URL('../support/typescript-loader.mjs',import.meta.url));register('data:text/javascript,'+encodeURIComponent(`export async function load(url,context,next){if(url.endsWith('.css'))return {format:'module',shortCircuit:true,source:'export default {}'};return next(url,context);}`),import.meta.url);
const {createStore}=await import('jotai');
const {cataloguePlaces,catalogueSavedLocation,catalogueDetail}=await import('../../app/feature/explore/places/catalogue.ts');
const {locationBookmark,placeIdentity}=await import('../../app/feature/saved/library-model.ts');
const {tripBlocksAtom}=await import('../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts');
const {scheduleSavedPlaceAtom}=await import('../../app/feature/planner/planId/_components/list/saved-places.atoms.ts');
const {savedPlaceKey}=await import('../../app/feature/planner/planId/_components/list/saved-places-model.ts');
const {readerPlaceData}=await import('../../app/feature/planner/_components/share/reader/reader-place-data.ts');
test('catalogue identity survives Saved, My List scheduling, duplicate additions, JSON reload and public reader',()=>{
 const p=cataloguePlaces[0],saved=catalogueSavedLocation(p.id);const payload=locationBookmark({providerPlaceId:p.id,name:p.name,location:{lat:p.lat,lng:p.lng}});
 assert.equal(placeIdentity(payload.providerPlaceId,p.lat,p.lng),p.id);assert.equal(saved.name,p.name);
 const store=createStore();const place={id:'saved',type:'place',placeId:p.id,name:p.name,address:saved.address,lat:p.lat,lng:p.lng};
 store.set(tripBlocksAtom,[{id:'list',kind:'list',title:'My List',date:'',items:[place]},{id:'day',kind:'itinerary',date:'2026-11-15',items:[]}]);
 const key=savedPlaceKey(place);assert.ok(store.set(scheduleSavedPlaceAtom,{placeId:key,dayId:'day'}));assert.equal(store.set(scheduleSavedPlaceAtom,{placeId:key,dayId:'day'}),undefined);
 const reloaded=JSON.parse(JSON.stringify(store.get(tripBlocksAtom)));const visits=reloaded.find(b=>b.id==='day').items;assert.equal(visits.length,1);assert.equal(visits[0].placeId,p.id);assert.equal(visits[0].lat,p.lat);
 const publicDetail=readerPlaceData(catalogueDetail(visits[0].placeId));assert.equal(publicDetail.place.name,p.name);assert.match(publicDetail.photos[0].url,/^\/images\/places-catalogue/);assert.ok(publicDetail.photoAttributions[0].displayName.includes(p.photo.license));
});
