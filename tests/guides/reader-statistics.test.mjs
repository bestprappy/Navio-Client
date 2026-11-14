import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {ReaderStatistics}=await import('../../components/reader-statistics.tsx');
const {batchedFavoriteCount}=await import('../../app/feature/saved/favorite-count.tsx');
test('reader metrics distinguish total openings, account visitors and active favorites',()=>{
 const html=renderToStaticMarkup(React.createElement(ReaderStatistics,{viewCount:24,uniqueViewCount:3,favoriteCount:2,ratingAverage:4.5,ratingCount:2}));
 for(const label of ['Total Views','Unique Visitors','Current Favorites','Rating','24','3','2','4.5 / 5'])assert.ok(html.includes(label),label);
 assert.match(html,/Signed-in accounts counted once/);assert.match(html,/href="#reader-feedback"/);
});
test('missing metrics stay unavailable while genuine zero counts remain visible',()=>{
 const html=renderToStaticMarkup(React.createElement(ReaderStatistics,{viewCount:0,uniqueViewCount:0,favoriteCount:0,ratingCount:0}));
 assert.match(html,/Not rated yet/);assert.doesNotMatch(html,/NaN|undefined/);
 const pending=renderToStaticMarkup(React.createElement(ReaderStatistics,{}));assert.match(pending,/\u2014/);
});
test('favorite requests deduplicate cards, bound batches to 48 and reject incomplete counts',async()=>{
 const original=globalThis.fetch,calls=[];
 try{
  globalThis.fetch=async url=>{const ids=new URL(url,'http://localhost').searchParams.getAll('identity');calls.push(ids);return Response.json(ids.map(identity=>({identity,count:2})));};
  const result=await Promise.all([...Array.from({length:50},(_,i)=>batchedFavoriteCount(`plan:${i}`)),batchedFavoriteCount('plan:0')]);
  assert.equal(result.length,51);assert.ok(result.every(count=>count===2));assert.deepEqual(calls.map(ids=>ids.length),[48,2]);
  globalThis.fetch=async()=>Response.json([]);await assert.rejects(batchedFavoriteCount('plan:missing'),/Incomplete/);
 }finally{globalThis.fetch=original;}
});
