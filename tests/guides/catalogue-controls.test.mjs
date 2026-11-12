import assert from 'node:assert/strict';
import {test} from 'node:test';
const {catalogueGroups}=await import('../../components/search/catalogue-model.ts');
const {sortValues,togglePriority,movePriority}=await import('../../components/search/sort-priorities.ts');
test('catalogue suggestions deduplicate titles across relevant and matching by identity',()=>{
 const a={id:'TRAVELER:one',title:'Tokyo food',subtitle:'Tokyo',href:'/one'};
 const b={...a,id:'CURATED:one',href:'/two'};
 const groups=catalogueGroups(['Tokyo food','Tokyo food',''],[a,a],[a,b]);
 assert.deepEqual(groups.suggestions,['Tokyo food']);assert.equal(groups.matching.length,1);assert.deepEqual(groups.relevant,[b]);
});
test('Guide sorting supports updated without introducing unsupported plan fields',()=>{
 const opts=[['relevance','Recommended'],['views','Most viewed'],['updated','Recently updated']];
 assert.deepEqual(sortValues('copies,updated',opts),['updated']);
 assert.equal(togglePriority('views','updated',opts),'views,updated');
 assert.equal(movePriority('views,updated','updated',-1,opts),'updated,views');
 assert.equal(togglePriority('updated','updated',opts),'relevance');
 assert.deepEqual(sortValues('relevance,views,views',opts),['views']);
});
