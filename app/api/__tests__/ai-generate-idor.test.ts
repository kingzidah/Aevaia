import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted spies shared with the vi.mock factories.
const h = vi.hoisted(() => ({
  authMock: vi.fn(),
  generateText: vi.fn(async () => ({ text: "generated copy" })),
  updateMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(async () => ({ id: "gen_1" })),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: h.authMock }));
vi.mock("ai", () => ({ generateText: h.generateText }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: () => ({ chat: () => ({}) }) }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ success: true, remaining: 10, retryAfter: 0 })),
  getIp: () => "1.2.3.4",
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    usageTracking: { updateMany: h.updateMany },
    project: { findUnique: h.findUnique },
    aiGeneration: { create: h.create },
  },
}));

import { POST } from "@/app/api/ai/generate/route";

function req(body: Record<string, unknown>) {
  return new Request("http://test/api/ai/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Flush the fire-and-forget project ownership → audit-write promise chain.
const flush = () => new Promise((r) => setTimeout(r, 0));

const ME = "user_ME";
const OTHER = "user_OTHER";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENROUTER_API_KEY = "test-key";
  h.authMock.mockResolvedValue({ userId: ME });
  h.generateText.mockResolvedValue({ text: "generated copy" });
});

describe("ai/generate — credit-session ownership (IDOR)", () => {
  it("owner's sessionId → decrement runs, scoped by userId, succeeds (1 credit)", async () => {
    h.updateMany.mockResolvedValue({ count: 1 });

    const res = await POST(req({ prompt: "hello world", sessionId: "sess_mine" }));

    expect(res.status).toBe(200);
    expect(h.updateMany).toHaveBeenCalledTimes(1);
    expect(h.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sess_mine", userId: ME, aiCredits: { gt: 0 } },
        data: { aiCredits: { decrement: 1 }, requestCount: { increment: 1 } },
      }),
    );
  });

  it("foreign sessionId → userId-scoped where matches zero rows, victim balance UNCHANGED (403)", async () => {
    // A session owned by OTHER cannot match the ME-scoped where → 0 rows.
    h.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(req({ prompt: "hello world", sessionId: "sess_of_other" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "BATTERY_DEPLETED" });
    // The decrement is gated on the caller's userId — never a bare id.
    expect(h.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: ME }),
      }),
    );
  });
});

describe("ai/generate — project audit-write ownership (IDOR)", () => {
  it("foreign projectId → no AiGeneration row written for the victim's project", async () => {
    h.findUnique.mockResolvedValue({ userId: OTHER });

    const res = await POST(req({ prompt: "hello world", projectId: "proj_of_other" }));
    await flush();

    expect(res.status).toBe(200);
    expect(h.findUnique).toHaveBeenCalledWith({
      where: { id: "proj_of_other" },
      select: { userId: true },
    });
    expect(h.create).not.toHaveBeenCalled();
  });

  it("owner's projectId → audit row written as before", async () => {
    h.findUnique.mockResolvedValue({ userId: ME });

    const res = await POST(req({ prompt: "hello world", projectId: "proj_mine" }));
    await flush();

    expect(res.status).toBe(200);
    expect(h.create).toHaveBeenCalledTimes(1);
    expect(h.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ projectId: "proj_mine", response: "generated copy" }),
    });
  });

  it("missing project → audit write skipped, no 500", async () => {
    h.findUnique.mockResolvedValue(null);

    const res = await POST(req({ prompt: "hello world", projectId: "proj_missing" }));
    await flush();

    expect(res.status).toBe(200);
    expect(h.create).not.toHaveBeenCalled();
  });
});
