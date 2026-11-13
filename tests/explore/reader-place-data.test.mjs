import assert from 'node:assert/strict';
import {register} from 'node:module';
import {test} from 'node:test';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {readerPlaceData}=await import('../../app/feature/planner/_components/share/reader/reader-place-data.ts');
test('normal cached details supply reader photo, metadata and hours without discovery',()=>{
 const result=readerPlaceData({provider:'GOOGLE',providerPlaceId:'ChITest',name:'Bridge',address:'Lucerne',lat:47,lng:8,imageUrl:'https://example.com/bridge.jpg',rating:4.7,reviewCount:38000,weekdayOpeningHours:['Monday: Open 24 hours'],category:'Bridge'});
 assert.equal(result.place.photoUrl,'https://example.com/bridge.jpg');
 assert.equal(result.place.category,'Bridge');assert.deepEqual(result.place.openingHours.weekdayDescriptions,['Monday: Open 24 hours']);
 assert.equal(result.photos.length,1);assert.equal(result.photos[0].url,result.place.photoUrl);
 assert.deepEqual(result.photos[0].attributions,[],'Never fabricate an author');
});
test('photo-less and unsafe photo responses stay empty rather than inventing images',()=>{
 for(const imageUrl of [undefined,'javascript:alert(1)']){
  const result=readerPlaceData({provider:'MAPBOX',providerPlaceId:'id',name:'Place',address:'',lat:0,lng:0,imageUrl});
  assert.equal(result.photos.length,0);assert.equal(result.place.photoUrl,undefined);
 }
});
