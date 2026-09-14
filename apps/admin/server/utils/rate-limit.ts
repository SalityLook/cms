/**
 * Simple in-process sliding-window rate limiter. Deliberately NOT backed by
 * Redis/a shared store — this project's declared deployment target is a
 * single self-hosted Node instance (see CLAUDE.md architecture decision #4),
 * so per-process in-memory state is sufficient and avoids adding an external
 * dependency. If this ever runs as multiple replicas behind a load balancer,
 * this stops being accurate per-client and would need a shared store instead.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Opportunistic cleanup so the map doesn't grow unbounded from one-off/expired keys. */
function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

/**
 * Returns true if the action identified by `key` is still within `limit`
 * attempts for the current `windowMs` window, and records this attempt.
 * Returns false once the limit has been exceeded for the current window.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    sweepExpired(now);
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
