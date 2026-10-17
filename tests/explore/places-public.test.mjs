import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { isPublicPlannerRequest } = await import(
  "../../app/api/_lib/public-planner-request.ts"
);
test("Explore GET reads are public while nested paths and mutations stay protected", () => {
  for (const path of [
    "/v1/geo/places/explore",
    "/v1/geo/places/explore/suggestions?query=Osaka",
  ]) {
    assert.equal(isPublicPlannerRequest("GET", path), true);
    for (const method of ["POST", "PUT", "PATCH", "DELETE"])
      assert.equal(isPublicPlannerRequest(method, path), false);
  }
  assert.equal(
    isPublicPlannerRequest("GET", "/v1/geo/places/explore/suggestions/private"),
    false,
  );
});
