import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { explorePlaces } = await import(
  "../../app/feature/explore/places/explore-api.ts"
);
test("expired pagination retains HTTP status so the UI can restart instead of retrying a dead cursor", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 400 }),
  );
  await assert.rejects(
    explorePlaces(
      { country: "JP", query: "sushi", types: [], interests: [], time: "any" },
      "",
      "",
      "expired",
      new AbortController().signal,
    ),
    (error) => error.status === 400 && /expired/.test(error.message),
  );
});
