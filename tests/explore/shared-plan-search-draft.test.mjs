import assert from 'node:assert/strict';
import { test } from 'node:test';
import { register } from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const { synchronizeDraft, requestText }=await import('../../app/feature/explore/_components/shared-plans/search/search-draft.ts');
test('own URL acknowledgement never strips a trailing space or overwrites newer typing',()=>{
 const draft={source:'Thai',value:'Thailand '};
 assert.deepEqual(synchronizeDraft(draft,'Thailand','Thailand'),{source:'Thailand',value:'Thailand '});
 assert.equal(synchronizeDraft({...draft,value:'Thailand Food'},'Thailand','Thailand').value,'Thailand Food');
 assert.equal(synchronizeDraft(draft,'Japan',null).value,'Japan');
});
test('request normalization leaves raw text untouched and whitespace-only changes share a request',()=>{
 const raw='  Thailand  food ';
 assert.equal(requestText(raw),'Thailand food');assert.equal(raw,'  Thailand  food ');
});
