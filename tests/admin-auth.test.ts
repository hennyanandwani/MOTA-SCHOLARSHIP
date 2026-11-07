import assert from "node:assert/strict";
import test from "node:test";
import { requireAdmin } from "../lib/adminAuth";

test("admin authorization lookup failures return a JSON 503 response", async () => {
  const result = await requireAdmin(async () => {
    throw Object.assign(new Error("synthetic database lookup failure"), {
      code: "P1001",
    });
  });

  assert.equal(result.user, null);
  assert.ok(result.response);
  assert.equal(result.response.status, 503);
  assert.equal(result.response.headers.get("content-type"), "application/json");
  assert.deepEqual(await result.response.json(), {
    error: "Unable to verify administrator access.",
    code: "AUTHORIZATION_UNAVAILABLE",
  });
});
