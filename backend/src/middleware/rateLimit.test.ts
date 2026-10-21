import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { clientKey, rateLimit } from "./rateLimit.js";

function fakeResponse() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      res.headers[name] = value;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function call(middleware: ReturnType<typeof rateLimit>, req: Partial<Request>) {
  const res = fakeResponse();
  let passed = false;
  const next: NextFunction = () => {
    passed = true;
  };
  middleware(req as Request, res as unknown as Response, next);
  return { res, passed };
}

test("blocks requests over the limit inside the window and resets after it", () => {
  let clock = 0;
  const limiter = rateLimit({ windowMs: 1000, max: 2, key: () => "k", now: () => clock });

  assert.equal(call(limiter, {}).passed, true);
  assert.equal(call(limiter, {}).passed, true);
  const blocked = call(limiter, {});
  assert.equal(blocked.passed, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.headers["Retry-After"], "1");

  clock = 1000;
  assert.equal(call(limiter, {}).passed, true);
});

test("keys are independent", () => {
  const limiter = rateLimit({
    windowMs: 1000,
    max: 1,
    key: (req) => String(req.headers?.authorization),
    now: () => 0,
  });
  assert.equal(call(limiter, { headers: { authorization: "a" } }).passed, true);
  assert.equal(call(limiter, { headers: { authorization: "b" } }).passed, true);
  assert.equal(call(limiter, { headers: { authorization: "a" } }).passed, false);
});

test("clientKey hashes bearer tokens and falls back to the IP", () => {
  const withToken = clientKey({ headers: { authorization: "Bearer secret-token" } } as Request);
  assert.match(withToken, /^t:[0-9a-f]{32}$/);
  assert.equal(withToken.includes("secret-token"), false);
  assert.equal(clientKey({ headers: {}, ip: "1.2.3.4" } as Request), "ip:1.2.3.4");
});
