import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function msToDuration(ms: number): Duration {
  const secs = Math.round(ms / 1000);
  if (secs % 3600 === 0) return `${secs / 3600} h` as Duration;
  if (secs % 60 === 0)   return `${secs / 60} m` as Duration;
  return `${secs} s` as Duration;
}

// Cache Ratelimit instances by config so they are not re-created on every request.
const limiterCache = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`;
  if (!limiterCache.has(key)) {
    limiterCache.set(key, new Ratelimit({
      redis,
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
  opts: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const { success, remaining, reset } = await getLimiter(opts.limit, opts.windowMs).limit(key);
  return {
    success,
    remaining,
    retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
  };
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
