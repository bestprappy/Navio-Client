import assert from "node:assert/strict";
import {register} from "node:module";import {test} from "node:test";
register(new URL("../support/typescript-loader.mjs",import.meta.url));
const {visibleMyListBlocks}=await import("../../app/feature/planner/planId/_components/list/saved-places-model.ts");
test("Starting Part is pinned separately rather than duplicated among ordinary lists",()=>{
 const blocks=[{id:"starting-part-main",kind:"list",title:"Before you go",items:[{id:"intro",type:"note",content:"## Welcome"}]},{id:"ideas",kind:"list",title:"Ideas",items:[]}];
 assert.deepEqual(visibleMyListBlocks(blocks).map(b=>b.id),["ideas"]);
 assert.equal(blocks[0].items[0].content,"## Welcome");
});
