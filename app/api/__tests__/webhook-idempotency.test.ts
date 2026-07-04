import { describe, it, expect, vi, beforeEach } from "vitest";

// Verifies the Stripe webhook fulfils a checkout exactly once. The idempotency
// insert (ProcessedStripeEvent) is the first statement in the fulfilment
// transaction, so a redelivered event id must roll everything back — no gift
// unlock and no credit grant may be applied twice.

const h = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  txStub: {
    processedStripeEvent: { create: vi.fn<(args?: unknown) => Promise<unknown>>(async () => ({})) },
    project: { update: vi.fn<(args?: unknown) => Promise<unknown>>(async () => ({})) },
    user: { upsert: vi.fn<(args?: unknown) => Promise<unknown>>(async () => ({})) },
  },
  transaction: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent: h.constructEvent };
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: h.transaction },
}));

import { POST as webhookPOST } from "@/app/api/webhook/route";

// Runs the route's transaction callback against the shared tx stub.
h.transaction.mockImplementation(async (cb: (tx: typeof h.txStub) => Promise<void>) => cb(h.txStub));

function webhookReq() {
  return new Request("http://test/api/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": "sig_test" },
    body: "{}",
  });
}

function p2002() {
  return Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
  h.transaction.mockImplementation(async (cb: (tx: typeof h.txStub) => Promise<void>) => cb(h.txStub));
  h.txStub.processedStripeEvent.create.mockResolvedValue({});
});

describe("credit top-up fulfilment", () => {
  it("grants 500 credits to the buyer exactly once", async () => {
    h.constructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { metadata: { product: "credit-topup-500", userId: "user_buyer" } } },
    });

    const res = await webhookPOST(webhookReq());
    expect(res.status).toBe(200);
    expect(h.txStub.processedStripeEvent.create).toHaveBeenCalledWith({
      data: { id: "evt_1", type: "checkout.session.completed" },
    });
    expect(h.txStub.user.upsert).toHaveBeenCalledTimes(1);
    const arg = h.txStub.user.upsert.mock.calls[0]![0] as { update: { credits: { increment: number } } };
    expect(arg.update.credits.increment).toBe(500);
  });

  it("does NOT credit twice when Stripe redelivers the same event", async () => {
    h.constructEvent.mockReturnValue({
      id: "evt_dup",
      type: "checkout.session.completed",
      data: { object: { metadata: { product: "credit-topup-500", userId: "user_buyer" } } },
    });
    // Simulate the idempotency insert failing on the duplicate id.
    h.txStub.processedStripeEvent.create.mockRejectedValue(p2002());

    const res = await webhookPOST(webhookReq());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.duplicate).toBe(true);
    expect(h.txStub.user.upsert).not.toHaveBeenCalled();
  });
});

describe("gift purchase fulfilment", () => {
  it("marks the project paid and published", async () => {
    h.constructEvent.mockReturnValue({
      id: "evt_gift",
      type: "checkout.session.completed",
      data: { object: { metadata: { giftId: "proj_1", tier: "INTIMATE" } } },
    });

    const res = await webhookPOST(webhookReq());
    expect(res.status).toBe(200);
    expect(h.txStub.user.upsert).not.toHaveBeenCalled();
    expect(h.txStub.project.update).toHaveBeenCalledTimes(1);
    const arg = h.txStub.project.update.mock.calls[0]![0] as { data: { isPaid: boolean; isPublished: string } };
    expect(arg.data.isPaid).toBe(true);
    expect(arg.data.isPublished).toBe("PUBLISHED");
  });
});

describe("signature verification", () => {
  it("rejects a request whose signature fails to verify", async () => {
    h.constructEvent.mockImplementation(() => { throw new Error("bad signature"); });
    const res = await webhookPOST(webhookReq());
    expect(res.status).toBe(400);
    expect(h.transaction).not.toHaveBeenCalled();
  });
});
