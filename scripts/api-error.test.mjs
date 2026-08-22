import test from "node:test";
import assert from "node:assert/strict";
import { toApiError } from "../src/lib/api-error.ts";

test("toApiError maps Prisma P1001 to 503", () => {
  const result = toApiError(
    new Error("Can't reach database server at `localhost:5433`")
  );
  assert.equal(result.status, 503);
  assert.equal(result.message, "Database unavailable");
});

test("toApiError maps connection refused to 503", () => {
  const result = toApiError(new Error("connect ECONNREFUSED 127.0.0.1:5433"));
  assert.equal(result.status, 503);
});

test("toApiError returns 500 for generic errors", () => {
  const result = toApiError(new Error("Something broke"));
  assert.equal(result.status, 500);
  assert.equal(result.message, "Something broke");
});

test("toApiError maps missing database to 503", () => {
  const result = toApiError(new Error('database "erikbabcan" does not exist'));
  assert.equal(result.status, 503);
});

test("toApiError handles non-Error values", () => {
  const result = toApiError("fail");
  assert.equal(result.status, 500);
  assert.equal(result.message, "Unknown error");
});
