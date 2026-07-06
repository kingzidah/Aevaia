import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Upstash so we control the limiter outcome without a real Redis.
//   • Redis     — constructible no-op (so getRedis() returns a non-null client
//                 when the env vars are present).
//   • Ratelimit — .limit() throws, simulating a reachable-but-erroring Redis
//                 ("Redis down"). The "absent" case is exercised separately by
//                 unsetting the env vars so getRedis() returns null first.
vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor(_opts: unknown) {}
  },
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    constructor(_opts: unknown) {}
    limit() {
      throw new Error("redis down");
    }
  },
}));

const ORIG_URL = process.env.UPSTASH_REDIS_REST_URL;
const ORIG_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Fresh module each test so the internal _redis singleton never leaks state
// between the "absent" and "present-but-erroring" scenarios.
async function loadRateLimit() {
  vi.resetModules();
  return (await import("./rate-limit")).rateLimit;
}

function setRedisPresent() {
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
}
function setRedisAbsent() {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  process.env.UPSTASH_REDIS_REST_URL = ORIG_URL;
  process.env.UPSTASH_REDIS_REST_TOKEN = ORIG_TOKEN;
});

const COST_BEARING = { limit: 30, windowMs: 60_000, failClosed: true };
const NON_COST_BEARING = { limit: 30, windowMs: 60_000 }; // failClosed omitted → defaults false

describe("rateLimit failClosed semantics when Redis is unavailable", () => {
  // (b) The unauthenticated cost-bearing path must be rejected when Redis is down.
  it("Redis ABSENT + failClosed:true → blocked (cost-bearing route)", async () => {
    setRedisAbsent();
    const rateLimit = await loadRateLimit();
    const res = await rateLimit("chat:1.2.3.4", COST_BEARING);
    expect(res.success).toBe(false);
  });

  it("Redis ERROR + failClosed:true → blocked (cost-bearing route)", async () => {
    setRedisPresent();
    const rateLimit = await loadRateLimit();
    const res = await rateLimit("ai-generate:1.2.3.4", COST_BEARING);
    expect(res.success).toBe(false);
  });

  // (c) Authenticated non-cost-bearing traffic keeps working (fails open) on a
  //     Redis blip — a deliberate availability trade-off.
  it("Redis ABSENT + failClosed omitted → allowed (authed non-cost-bearing route)", async () => {
    setRedisAbsent();
    const rateLimit = await loadRateLimit();
    const res = await rateLimit("project-save:user_123", NON_COST_BEARING);
    expect(res.success).toBe(true);
  });

  it("Redis ERROR + failClosed omitted → allowed (authed non-cost-bearing route)", async () => {
    setRedisPresent();
    const rateLimit = await loadRateLimit();
    const res = await rateLimit("project-save:user_123", NON_COST_BEARING);
    expect(res.success).toBe(true);
  });

  it("logs loudly (stderr) whenever Redis is unavailable", async () => {
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    setRedisAbsent();
    const rateLimit = await loadRateLimit();
    await rateLimit("chat:1.2.3.4", COST_BEARING);
    const emitted = spy.mock.calls.map((c) => String(c[0])).join("");
    expect(emitted).toContain("redis.unavailable");
    // The full key (which embeds an IP / user id) must never be logged.
    expect(emitted).not.toContain("1.2.3.4");
    spy.mockRestore();
  });
});
