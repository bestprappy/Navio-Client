import assert from "node:assert/strict";
import { test } from "node:test";
import { readUploadBody, UploadTooLargeError, isCrossOriginMutation } from "../../app/api/_lib/upload-request.ts";

test("binary multipart data is forwarded byte for byte",async () => {
  const bytes = new Uint8Array([0,255,128,65,13,10]);
  assert.deepEqual(await readUploadBody(new Request("http://navio.test/upload",{method:"POST",body:bytes})),bytes);
});

test("oversized chunked uploads are stopped even without Content-Length",async () => {
  let canceled = false;
  const stream = new ReadableStream({start(controller) { controller.enqueue(new Uint8Array(6*1024*1024)); controller.enqueue(new Uint8Array(1)); },cancel() { canceled=true; }});
  await assert.rejects(() => readUploadBody(new Request("http://navio.test/upload",{method:"POST",body:stream,duplex:"half"})),UploadTooLargeError);
  assert.equal(canceled,true);
});

test("declared oversized uploads are rejected before reading",async () => {
  await assert.rejects(() => readUploadBody(new Request("http://navio.test/upload",{method:"POST",headers:{"content-length":String(7*1024*1024)},body:"x"})),UploadTooLargeError);
});

test("cross-site cookie mutations are rejected but same-origin uploads work",() => {
  assert.equal(isCrossOriginMutation(new Request("http://navio.test/upload",{method:"POST",headers:{origin:"https://attacker.test"}})),true);
  assert.equal(isCrossOriginMutation(new Request("http://navio.test/upload",{method:"POST",headers:{"sec-fetch-site":"cross-site"}})),true);
  assert.equal(isCrossOriginMutation(new Request("http://navio.test/upload",{method:"POST",headers:{origin:"http://navio.test"}})),false);
  assert.equal(isCrossOriginMutation(new Request("http://navio.test/upload",{headers:{origin:"https://attacker.test"}})),false);
});

test("reverse proxies use a configured public origin instead of trusting forwarded headers",() => {
  const request = new Request("http://client:3000/api/posts",{method:"POST",headers:{origin:"https://navio.test"}});
  assert.equal(isCrossOriginMutation(request,"https://navio.test"),false);
  const forged = new Request("http://client:3000/api/posts",{method:"POST",headers:{origin:"https://attacker.test","x-forwarded-host":"attacker.test"}});
  assert.equal(isCrossOriginMutation(forged,"https://navio.test"),true);
});
