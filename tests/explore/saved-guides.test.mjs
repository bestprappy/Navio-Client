import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const model=await import('../../app/feature/saved/library-model.ts');
test('guide identities distinguish sources and only route to public readers',()=>{
 const id='20000000-0000-4000-8000-000000000001';
 assert.equal(model.guideIdentity(id,'TRAVELER'),`guide:traveler:${id}`);
 assert.notEqual(model.guideIdentity(id,'TRAVELER'),model.guideIdentity(id,'CURATED'));
 assert.equal(model.savedGuidePath(`guide:traveler:${id}`),`/explore/guides/${id}`);
 assert.equal(model.savedGuidePath(`guide:curated:${id}`),`/explore/guides/${id}?source=curated`);
 assert.throws(()=>model.savedGuidePath('guide:editor:javascript:bad'));
});
