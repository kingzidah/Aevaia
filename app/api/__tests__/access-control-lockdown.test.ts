import { describe, it, expect, vi, beforeEach } from "vitest";

// Regression tests for the 2026-07 access-control lockdown. Each case pins a
// vulnerability that was patched so it cannot silently reopen:
//   • /api/gifts/list  — was unauthenticated + unscoped (info disclosure/IDOR)
//   • /api/checkout    — was unauthenticated (anon Stripe session creation)
//   • /api/rsvp        — accepted arbitrary/non-existent gift_id (data pollution)

const h = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAuthUserId: vi.fn(),
  rateLimit: vi.fn(async () => ({ success: true, remaining: 10, retryAfter: 0 })),
  projectFindMany: vi.fn<(args?: unknown) => Promise<unknown[]>>(async () => []),
  projectFindUnique: vi.fn<(args?: unknown) => Promise<unknown>>(async () => null),
  supabaseInsert: vi.fn<(rows?: unknown) => Promise<{ error: unknown }>>(async () => ({ error: null })),
  stripeCreate: vi.fn<(args?: unknown) => Promise<{ url: string }>>(async () => ({ url: "https://stripe/session" })),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: h.authMock }));
vi.mock("@/lib/system-user", () => ({ getAuthenticatedUserId: h.getAuthUserId }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: h.rateLimit, getIp: () => "1.2.3.4" }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findMany: h.projectFindMany, findUnique: h.projectFindUnique },
  },
}));
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: { from: () => ({ insert: h.supabaseInsert }) },
}));
vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: h.stripeCreate } };
  },
}));

import { POST as giftsListPOST } from "@/app/api/gifts/list/route";
import { POST as checkoutPOST } from "@/app/api/checkout/route";
import { POST as rsvpPOST } from "@/app/api/rsvp/route";

function jsonReq(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://test" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.rateLimit.mockResolvedValue({ success: true, remaining: 10, retryAfter: 0 });
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
});

describe("/api/gifts/list — auth + ownership scoping", () => {
  it("rejects unauthenticated callers with 401", async () => {
    h.getAuthUserId.mockResolvedValue(null);
    const res = await giftsListPOST(jsonReq("http://test/api/gifts/list", { ids: ["p1"] }));
    expect(res.status).toBe(401);
    expect(h.projectFindMany).not.toHaveBeenCalled();
  });

  it("scopes the DB query to the caller's own userId", async () => {
    h.getAuthUserId.mockResolvedValue("user_123");
    await giftsListPOST(jsonReq("http://test/api/gifts/list", { ids: ["p1", "p2"] }));
    expect(h.projectFindMany).toHaveBeenCalledTimes(1);
    const arg = h.projectFindMany.mock.calls[0]![0] as { where: { userId: string } };
    expect(arg.where.userId).toBe("user_123");
  });
});

describe("/api/checkout — auth required before Stripe", () => {
  it("rejects unauthenticated callers with 401 and never creates a session", async () => {
    h.authMock.mockResolvedValue({ userId: null });
    const res = await checkoutPOST(jsonReq("http://test/api/checkout", {}));
    expect(res.status).toBe(401);
    expect(h.stripeCreate).not.toHaveBeenCalled();
  });

  it("stamps the buyer's userId into session metadata when authenticated", async () => {
    h.authMock.mockResolvedValue({ userId: "user_abc" });
    await checkoutPOST(jsonReq("http://test/api/checkout", {}));
    expect(h.stripeCreate).toHaveBeenCalledTimes(1);
    const arg = h.stripeCreate.mock.calls[0]![0] as { metadata: { userId: string }; client_reference_id: string };
    expect(arg.metadata.userId).toBe("user_abc");
    expect(arg.client_reference_id).toBe("user_abc");
  });
});

describe("/api/rsvp — gift must exist and be published", () => {
  it("returns 404 and does not insert for a non-existent gift_id", async () => {
    h.projectFindUnique.mockResolvedValue(null);
    const res = await rsvpPOST(
      jsonReq("http://test/api/rsvp", { gift_id: "ghost", guest_name: "Mallory", attending: true }),
    );
    expect(res.status).toBe(404);
    expect(h.supabaseInsert).not.toHaveBeenCalled();
  });

  it("returns 404 and does not insert for an unpublished gift", async () => {
    h.projectFindUnique.mockResolvedValue({ isPublished: "DRAFT" });
    const res = await rsvpPOST(
      jsonReq("http://test/api/rsvp", { gift_id: "draft1", guest_name: "Guest", attending: true }),
    );
    expect(res.status).toBe(404);
    expect(h.supabaseInsert).not.toHaveBeenCalled();
  });

  it("inserts the RSVP for a published gift", async () => {
    h.projectFindUnique.mockResolvedValue({ isPublished: "PUBLISHED" });
    const res = await rsvpPOST(
      jsonReq("http://test/api/rsvp", { gift_id: "live1", guest_name: "Guest", attending: true }),
    );
    expect(res.status).toBe(200);
    expect(h.supabaseInsert).toHaveBeenCalledTimes(1);
  });
});
