import assert from 'node:assert/strict';
import {register} from 'node:module';
import {test} from 'node:test';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {placeIdentity,parseSavedSearch,savedSearchParams,locationBookmark,clampSavedPage}=await import('../../app/feature/saved/library-model.ts');
test('both provider formats share one bookmark and never include owner annotations',()=>{
 assert.equal(placeIdentity('GOOGLE:ChIJone',1,2),placeIdentity('ChIJone',1,2));
 const p=locationBookmark({providerPlaceId:'ChIJone',name:'Temple',address:'Tokyo',location:{lat:1,lng:2},notes:'secret',checklists:['private']},'token');
 assert.equal(p.sourceToken,'token');assert.equal('notes' in p,false);assert.equal('checklists' in p,false);
});
test('removing the last item on a later page returns to a populated page',()=>{
 assert.equal(clampSavedPage(1,25),1);assert.equal(clampSavedPage(1,24),0);assert.equal(clampSavedPage(3,0),0);
});
test('library URL preserves advanced filters and bounds invalid navigation',()=>{
 const a=parseSavedSearch(new URLSearchParams('tab=trash&page=-4&q=caf%C3%A9&country=Japan&sort=invalid'));
 assert.equal(a.tab,'trash');assert.equal(a.page,0);assert.equal(a.sort,'NEWEST');assert.equal(a.search,'café');
 assert.equal(parseSavedSearch(savedSearchParams({...a,city:'Tokyo'})).city,'Tokyo');
});
