import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {createElement}=await import('react');
const {renderToStaticMarkup}=await import('react-dom/server');
const {SortPriorityControl}=await import('../../app/feature/explore/_components/shared-plans/search/sort-priority-control.tsx');
const render=value=>renderToStaticMarkup(createElement(SortPriorityControl,{value,onChange:()=>{throw new Error('Rendering must not change sorting');}}));
test('Recommended is automatic status rather than a selectable sorting priority',()=>{
 const html=render('relevance');
 assert.match(html,/role="status" aria-label="Default sorting" data-active="true"/);
 assert.match(html,/Used automatically when no sorting priorities are selected/);
 assert.equal((html.match(/type="checkbox"/g)??[]).length,6);
 assert.doesNotMatch(html,/type="checkbox"[^>]*relevance/);
 assert.ok(html.indexOf('Default sorting')<html.indexOf('Sorting priorities'));
});
test('An explicit sort deactivates the Recommended indicator and retains its priority number',()=>{
 const html=render('views,rating');
 assert.match(html,/aria-label="Default sorting" data-active="false"/);
 assert.match(html,/aria-label="Priority 1"/);assert.match(html,/aria-label="Priority 2"/);
 assert.ok(html.indexOf('>Most viewed</label>')<html.indexOf('>Highest rated</label>'));
});
