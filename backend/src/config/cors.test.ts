import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCAL_FRONTEND_ORIGIN,
  PRODUCTION_FRONTEND_ORIGIN,
  isAllowedCorsOrigin,
} from "./cors.js";

test("allows the production Vercel origin", () => {
  assert.equal(isAllowedCorsOrigin(PRODUCTION_FRONTEND_ORIGIN), true);
});

test("allows local Vite origin", () => {
  assert.equal(isAllowedCorsOrigin(LOCAL_FRONTEND_ORIGIN), true);
});

test("allows missing Origin for non-browser clients", () => {
  assert.equal(isAllowedCorsOrigin(undefined), true);
});

test("rejects unknown origins without using a wildcard", () => {
  assert.equal(isAllowedCorsOrigin("https://evil.example"), false);
  assert.equal(isAllowedCorsOrigin("*"), false);
});
