type Bucket = {
  hits: number[];
  lastAt: number;
};

const buckets = new Map<string, Bucket>();

function prune(now: number, windowMs: number, hits: number[]) {
  return hits.filter((at) => now - at < windowMs);
}

export function consumeRateLimit(params: {
  key: string;
  max: number;
  windowMs: number;
  cooldownMs?: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(params.key) ?? { hits: [], lastAt: 0 };
  current.hits = prune(now, params.windowMs, current.hits);

  if (params.cooldownMs && current.lastAt && now - current.lastAt < params.cooldownMs) {
    const retryAfterSec = Math.ceil(
      (params.cooldownMs - (now - current.lastAt)) / 1000,
    );
    buckets.set(params.key, current);
    return { ok: false, retryAfterSec: Math.max(retryAfterSec, 1) };
  }

  if (current.hits.length >= params.max) {
    const oldest = current.hits[0] ?? now;
    const retryAfterSec = Math.ceil((params.windowMs - (now - oldest)) / 1000);
    buckets.set(params.key, current);
    return { ok: false, retryAfterSec: Math.max(retryAfterSec, 1) };
  }

  current.hits.push(now);
  current.lastAt = now;
  buckets.set(params.key, current);
  return { ok: true };
}

export function clientIp(req: {
  ip?: string;
  headers: { [key: string]: string | string[] | undefined };
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.ip || "unknown";
}
