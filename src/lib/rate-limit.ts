import { AppError } from "@/lib/errors";

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  var __shohayRateLimits: Map<string, Bucket> | undefined;
}

const buckets = globalThis.__shohayRateLimits ?? new Map<string, Bucket>();
globalThis.__shohayRateLimits = buckets;

/**
 * Fixed-window limiter. Process-local: replace with Redis or the database when running
 * more than one instance.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [entryKey, entry] of buckets) if (entry.resetAt <= now) buckets.delete(entryKey);
    }
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const minutes = Math.max(1, Math.ceil((bucket.resetAt - now) / 60_000));
    throw new AppError(429, `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}

/** Best-effort client address. Only trust x-forwarded-for when deployed behind your own proxy. */
export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
