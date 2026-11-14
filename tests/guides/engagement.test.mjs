import {test} from 'node:test';
import assert from 'node:assert/strict';
import {feedbackPath} from '../../app/feature/planner/_components/share/feedback/feedback-path.ts';
test('Guide feedback source is part of its route and never collides with a plan token',()=>{
 const id='aed0ceea-d61b-5023-89a5-e46ea3076215';
 assert.equal(feedbackPath(`guide:CURATED:${id}`),`/api/traveler-guides/discovery/CURATED/${id}/feedback`);
 assert.equal(feedbackPath(`guide:TRAVELER:${id}`),`/api/traveler-guides/discovery/TRAVELER/${id}/feedback`);
 assert.equal(feedbackPath('plan-token'),'/api/shared-plans/plan-token/feedback');
 assert.equal(feedbackPath('guide:CURATED:../rating'),'/api/shared-plans/guide%3ACURATED%3A..%2Frating/feedback');
});
test('Guide API routes have no optional catch-all that could shadow the feedback comment and rating routes',async()=>{
 const {readdir}=await import('node:fs/promises');
 const entries=await readdir(new URL('../../app/api/traveler-guides/',import.meta.url),{recursive:true});
 assert.deepEqual(entries.filter(entry=>entry.includes('[[...')),[]);
 assert.ok(entries.map(entry=>entry.split(String.fromCharCode(92)).join('/')).includes('discovery/[source]/[id]/feedback/[...path]/route.ts'));
});
