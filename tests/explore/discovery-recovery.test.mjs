import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {ExplorePlansError}=await import('../../app/feature/explore/_components/shared-plans/explore-plans-api.ts');
const {shouldRefreshDiscovery}=await import('../../app/feature/explore/_components/shared-plans/search/search-results.ts');
test('changed catalogue starts a fresh collection rather than retrying its stale page',()=>{
 assert.equal(shouldRefreshDiscovery(new ExplorePlansError('Changed',409)),true);
 assert.equal(shouldRefreshDiscovery(new ExplorePlansError('Temporary outage',502)),false);
 assert.equal(shouldRefreshDiscovery(new Error('offline')),false);
});
