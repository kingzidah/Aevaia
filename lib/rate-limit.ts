import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { slog } from "./logger";

// Lazy singleton — not constructed until the first rateLimit() call so a
// missing env var during module import does not crash the entire API route.
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

function msToDuration(ms: number): Duration {
  const secs = Math.round(ms / 1000);
  if (secs % 3600 === 0) return `${secs / 3600} h` as Duration;
  if (secs % 60 === 0)   return `${secs / 60} m` as Duration;
  return `${secs} s` as Duration;
}

// Cache Ratelimit instances by config so they are not re-created on every request.
const limiterCache = new Map<string, Ratelimit>();
function getLimiter(client: Redis, limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`;
  if (!limiterCache.has(key)) {
    limiterCache.set(key, new Ratelimit({
      redis:   client,
      limiter: Ratelimit.slidingWindow(limit, msToDuration(windowMs)),
      prefix:  "@hc/rl",
    }));
  }
  return limiterCache.get(key)!;
}

export interface RateLimitResult {
  success:    boolean;
  remaining:  number;
  retryAfter: number; // seconds until the window resets
}

export async function rateLimit(
  key: string,
  // `failClosed` makes the Redis-unavailable behaviour explicit per caller:
  //   • true  → cost-bearing routes (chat, generate, ai/generate, generate/image).
  //             When Upstash is absent or errors, REJECT rather than wave traffic
  //             through unmetered onto paid OpenRouter/Replicate calls.
  //   • false → default. Non-cost-bearing authenticated routes (project-save,
  //             gifts-create, …) keep failing OPEN so a Redis blip never breaks
  //             a legitimate user's save. This is a deliberate availability trade-off.
  // Either way we log loudly (stderr via slog) whenever Redis is unavailable.
  opts: { limit: number; windowMs: number; failClosed?: boolean },
): Promise<RateLimitResult> {
  // Only the bucket label is logged (e.g. "chat", "ai-generate") — never the
  // full key, which embeds an IP or user id we don't want in logs (GDPR).
  const scope = key.split(":")[0];

  // Shared result for every Redis-unavailable branch. failClosed decides the verdict.
  const unavailable = (reason: string): RateLimitResult => {
    slog("error", "rate-limit", "redis.unavailable", {
      reason,
      scope,
      failClosed: Boolean(opts.failClosed),
      verdict: opts.failClosed ? "blocked" : "allowed",
    });
    return opts.failClosed
      ? { success: false, remaining: 0, retryAfter: 60 }
      : { success: true, remaining: -1, retryAfter: 0 };
  };

  const client = getRedis();
  if (!client) {
    // No Redis configured (env vars absent in local dev, or misconfigured prod).
    return unavailable("not_configured");
  }
  try {
    const { success, remaining, reset } = await getLimiter(client, opts.limit, opts.windowMs).limit(key);
    return {
      success,
      remaining,
      retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
    };
  } catch {
    // Redis reachable at config time but the request failed (network, eviction…).
    return unavailable("request_error");
  }
}

/**
 * Extract the best-available client IP from proxy headers.
 * x-real-ip is set by Vercel's infrastructure and is not client-spoofable.
 * x-forwarded-for is used as a fallback for non-Vercel hosts.
 */
export function getIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}
