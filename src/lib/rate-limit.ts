// ============================================================================
// SANCHIVA — Lightweight in-memory rate limiter
// ----------------------------------------------------------------------------
// Guards auth endpoints against brute-force attacks. This is a simple
// fixed-window counter keyed by IP+path; for production scale, swap in
// `express-rate-limit` behind an external store (Redis). Each request costs
// 1 token; the window refills every `windowMs`.
// ============================================================================

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export function rateLimit(opts: {
  key: string;
  ip: string;
  limit: number;
  windowMs: number;
}) {
  const k = `${opts.key}:${opts.ip}`;
  const now = Date.now();
  let bucket = store.get(k);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    store.set(k, bucket);
  }
  bucket.count += 1;
  const remaining = Math.max(0, opts.limit - bucket.count);
  return {
    ok: bucket.count <= opts.limit,
    remaining,
    resetAt: bucket.resetAt,
  };
}

// Convenience: pull client IP from Next.js headers (Caddy sets X-Real-IP).
export function getClientIp(req: Request): string {
  const xReal = req.headers.get("x-real-ip");
  const xff = req.headers.get("x-forwarded-for");
  return xReal || (xff?.split(",")[0]?.trim() ?? "0.0.0.0");
}

// Periodic eviction so the map doesn't grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of store) if (b.resetAt < now) store.delete(k);
  }, 60_000).unref?.();
}
