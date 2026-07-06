import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ authMock: vi.fn(), findUnique: vi.fn() }));

vi.mock("@clerk/nextjs/server", () => ({ auth: h.authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { usageTracking: { findUnique: h.findUnique } },
}));

import { GET } from "@/app/api/session/credits/route";

function get(id?: string) {
  const url = id
    ? `http://test/api/session/credits?id=${id}`
    : "http://test/api/session/credits";
  return new Request(url);
}

beforeEach(() => vi.clearAllMocks());

describe("(d) session/credits ownership enforcement", () => {
  it("401 when unauthenticated", async () => {
    h.authMock.mockResolvedValue({ userId: null });
    const res = await GET(get("sess_1"));
    expect(res.status).toBe(401);
  });

  it("cannot read ANOTHER user's credit balance (IDOR fixed)", async () => {
    h.authMock.mockResolvedValue({ userId: "user_ME" });
    h.findUnique.mockResolvedValue({ aiCredits: 500, userId: "user_OTHER" });

    const res = await GET(get("sess_belongs_to_other"));

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).not.toHaveProperty("aiCredits"); // balance never leaked
  });

  it("CAN read own credit balance", async () => {
    h.authMock.mockResolvedValue({ userId: "user_ME" });
    h.findUnique.mockResolvedValue({ aiCredits: 42, userId: "user_ME" });

    const res = await GET(get("sess_mine"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ aiCredits: 42 });
  });

  it("404 for a missing row (no existence leak, same as not-owned)", async () => {
    h.authMock.mockResolvedValue({ userId: "user_ME" });
    h.findUnique.mockResolvedValue(null);

    const res = await GET(get("sess_missing"));
    expect(res.status).toBe(404);
  });
});
