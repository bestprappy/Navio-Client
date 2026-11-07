import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {createElement}=await import('react');
const {renderToStaticMarkup}=await import('react-dom/server');
const {DiscoveryLabel}=await import('../../app/feature/explore/_components/shared-plans/search/discovery-label.tsx');
test('Discovery labels clearly distinguish real activity from fallback picks',()=>{
 for(const [kind,label] of [['trending','Trending now'],['popular','Popular pick'],['recent','Recently shared']]){
  const html=renderToStaticMarkup(createElement(DiscoveryLabel,{kind}));
  assert.ok(html.includes(label));assert.ok(!html.includes('<button'));
 }
});
test('Legacy or missing discovery metadata never invents a trending label',()=>{
 assert.equal(renderToStaticMarkup(createElement(DiscoveryLabel,{})),'');
});
