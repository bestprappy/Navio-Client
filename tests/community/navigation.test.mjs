import assert from 'node:assert/strict';
import {register} from 'node:module';
import {test} from 'node:test';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {NAVIO_MENU,COMMUNITY_NAV,isNavioNavActive,isCommunityNavActive}=await import('../../app/feature/community/community-navigation.ts');
test('Navio links use the normal site destinations, separately from community feeds',()=>{
 assert.deepEqual(NAVIO_MENU.map(({title,href})=>[title,href]),[['Home','/'],['Dashboard','/dashboard'],['Explore','/explore'],['Community','/community']]);
 assert.deepEqual(COMMUNITY_NAV.map(({href})=>href),['/community','/community/popular','/community/discovery']);
 assert.notEqual(NAVIO_MENU.find(x=>x.title==='Explore').icon,COMMUNITY_NAV.find(x=>x.title==='Explore').icon);
});
test('Community remains the active Navio destination across community subpages',()=>{
 for(const path of ['/community','/community/popular','/community/discovery','/community/thailand/post/123']){
  assert.deepEqual(NAVIO_MENU.filter(x=>isNavioNavActive(path,x.href)).map(x=>x.title),['Community']);
 }
 assert.equal(isCommunityNavActive('/community/discovery','/community'),false);
 assert.equal(isCommunityNavActive('/community/discovery','/community/discovery'),true);
 assert.equal(isNavioNavActive('/community-other','/community'),false);
});
