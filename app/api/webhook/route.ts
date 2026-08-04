import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey     = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeKey) {
    console.error("[webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Raw text body — constructEvent uses the exact bytes for HMAC verification.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeKey);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await fulfilCheckout(event.id, session);
    } catch (err) {
      // A duplicate event id means Stripe re-delivered an event we already
      // fulfilled — the idempotency insert failed the transaction, so nothing
      // was applied twice. Acknowledge with 200 so Stripe stops retrying.
      if (isAlreadyProcessed(err)) {
        return NextResponse.json({ received: true, duplicate: true });
      }
      // Genuine failure: return 500 so Stripe retries later. Because fulfilment
      // runs in a transaction with the idempotency insert, nothing partial was
      // committed — the retry starts clean.
      console.error("[webhook] Fulfilment failed for event:", event.id, err);
      return NextResponse.json({ error: "Fulfilment failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// Prisma unique-constraint violation (duplicate primary key on the event id).
function isAlreadyProcessed(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err &&
    (err as { code?: string }).code === "P2002";
}

// Credits granted for the fixed 500-credit top-up product.
const CREDIT_TOPUP_AMOUNT = 500;

// Applies a completed checkout exactly once. The ProcessedStripeEvent insert is
// the first statement in the transaction, so a redelivered event id aborts the
// whole transaction (P2002) before any credit or fulfilment is applied.
async function fulfilCheckout(eventId: string, session: Stripe.Checkout.Session): Promise<void> {
  const projectId = session.metadata?.giftId;
  const product   = session.metadata?.product;
  const buyerId   = session.metadata?.userId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).$transaction(async (tx: any) => {
    // Idempotency guard — throws P2002 on a duplicate delivery.
    await tx.processedStripeEvent.create({
      data: { id: eventId, type: "checkout.session.completed" },
    });

    // ── Path A: gift purchase (unlocks a project + seeds the bouncer gate) ──
    if (projectId) {
      const rawTier   = session.metadata?.tier ?? "INTIMATE";
      const deviceCap = parseInt(session.metadata?.deviceCap ?? "5", 10);
      const tier      = rawTier === "EVENT" ? "EVENT" : "INTIMATE";

      let guestList: string[] = [];
      if (tier === "EVENT" && session.metadata?.guestList) {
        try {
          const parsed = JSON.parse(session.metadata.guestList);
          if (Array.isArray(parsed)) guestList = parsed.filter((n): n is string => typeof n === "string");
        } catch {
          console.warn("[webhook] Failed to parse guestList metadata");
        }
      }

      await tx.project.update({
        where: { id: projectId },
        data: {
          isPaid:      true,
          isPublished: "PUBLISHED",
          tier,
          deviceCap:   isNaN(deviceCap) ? 5 : deviceCap,
          ...(tier === "EVENT" && { guestList, claimedNames: [] }),
        },
      });
      return;
    }

    // ── Path B: credit top-up (grants credits to the authenticated buyer) ──
    if (product === "credit-topup-500" && buyerId) {
      await tx.user.upsert({
        where:  { clerkId: buyerId },
        create: { clerkId: buyerId, email: `${buyerId}@placeholder.aevaia`, credits: 1000 + CREDIT_TOPUP_AMOUNT },
        update: { credits: { increment: CREDIT_TOPUP_AMOUNT } },
      });
      return;
    }

    // Neither path matched — nothing to fulfil, but the event is now recorded
    // so we don't reprocess it. (Logged for observability.)
    console.warn("[webhook] checkout.session.completed had no actionable metadata:", eventId);
  });
}
