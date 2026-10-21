import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  key: (req: Request) => string;
  now?: () => number;
};

/**
 * Fixed-window limiter kept in memory. Limits are per API instance, which is enough to stop a
 * single client from hammering Google, Gmail or the AI providers through Lunyon.
 */
export function rateLimit(options: RateLimitOptions) {
  const now = options.now ?? Date.now;
  const buckets = new Map<string, Bucket>();

  const sweep = setInterval(() => {
    const current = now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= current) buckets.delete(key);
    }
  }, options.windowMs);
  sweep.unref();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = options.key(req);
    const current = now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= current) {
      bucket = { count: 0, resetAt: current + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    res.setHeader("RateLimit-Limit", String(options.max));
    res.setHeader("RateLimit-Remaining", String(Math.max(options.max - bucket.count, 0)));
    if (bucket.count > options.max) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - current) / 1000)));
      return res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
    }
    return next();
  };
}

/** Bearer token hash when present (one bucket per session), otherwise the client IP. */
export function clientKey(req: Request) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return `t:${createHash("sha256").update(header.slice(7)).digest("hex").slice(0, 32)}`;
  }
  return `ip:${req.ip ?? "unknown"}`;
}

/** Use after requireAuth. */
export function userKey(req: Request) {
  return req.user ? `u:${req.user.id}` : clientKey(req);
}

/** Shared limiter for endpoints that call an AI provider. */
export const aiRateLimit = rateLimit({ windowMs: 60_000, max: 20, key: userKey });
