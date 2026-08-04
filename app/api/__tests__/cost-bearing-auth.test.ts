import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted spies — shared with the vi.mock factories below.
const h = vi.hoisted(() => ({
  authMock: vi.fn(),
  streamText: vi.fn(() => ({ toTextStreamResponse: () => new Response("stream") })),
  generateText: vi.fn(async () => ({ text: "generated" })),
  replicateCtor: vi.fn(() => ({ run: vi.fn(async () => ["http://img"]) })),
  rateLimit: vi.fn(async () => ({ success: true, remaining: 10, retryAfter: 0 })),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: h.authMock }));
vi.mock("ai", () => ({ streamText: h.streamText, generateText: h.generateText }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: () => ({ chat: () => ({}) }) }));
vi.mock("replicate", () => ({ default: h.replicateCtor }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: h.rateLimit, getIp: () => "1.2.3.4" }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    usageTracking: { updateMany: vi.fn(async () => ({ count: 1 })), findUnique: vi.fn() },
    aiGeneration: { create: vi.fn() },
  },
}));

import { POST as chatPOST } from "@/app/api/chat/route";
import { POST as generatePOST } from "@/app/api/generate/route";
import { POST as aiGeneratePOST } from "@/app/api/ai/generate/route";
import { POST as imagePOST } from "@/app/api/generate/image/route";

function req(url: string, body: unknown = { prompt: "hello world" }) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ROUTES = [
  ["chat", chatPOST, "http://test/api/chat"],
  ["generate", generatePOST, "http://test/api/generate"],
  ["ai/generate", aiGeneratePOST, "http://test/api/ai/generate"],
  ["generate/image", imagePOST, "http://test/api/generate/image"],
] as const;

beforeEach(() => {
  vi.clearAllMocks();
  // Default rate-limit allows — so a non-401 outcome can only come from auth.
  h.rateLimit.mockResolvedValue({ success: true, remaining: 10, retryAfter: 0 });
  // Provide an OpenRouter key so the only failure under test is auth, not config.
  process.env.OPENROUTER_API_KEY = "test-key";
  process.env.REPLICATE_API_TOKEN = "test-token";
});

describe("(a) cost-bearing routes reject unauthenticated callers", () => {
  it.each(ROUTES)("%s → 401 when there is no Clerk session", async (_name, handler, url) => {
    h.authMock.mockResolvedValue({ userId: null });
    const res = await handler(req(url));
    expect(res.status).toBe(401);
  });

  it("no OpenRouter/Replicate call is made for any unauthenticated request", async () => {
    h.authMock.mockResolvedValue({ userId: null });
    await chatPOST(req("http://test/api/chat"));
    await generatePOST(req("http://test/api/generate"));
    await aiGeneratePOST(req("http://test/api/ai/generate"));
    await imagePOST(req("http://test/api/generate/image"));
    expect(h.streamText).not.toHaveBeenCalled();
    expect(h.generateText).not.toHaveBeenCalled();
    expect(h.replicateCtor).not.toHaveBeenCalled();
  });
});

describe("(b) auth precedes the rate limiter", () => {
  it.each(ROUTES)(
    "%s → still 401 for unauth even when Redis is down (limiter would block)",
    async (_name, handler, url) => {
      h.authMock.mockResolvedValue({ userId: null });
      // Simulate failClosed Redis-down verdict from the limiter.
      h.rateLimit.mockResolvedValue({ success: false, remaining: 0, retryAfter: 60 });
      const res = await handler(req(url));
      expect(res.status).toBe(401);
    },
  );
});
