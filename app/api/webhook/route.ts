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
    const session   = event.data.object as Stripe.Checkout.Session;
    const projectId = session.metadata?.giftId;
    const rawTier   = session.metadata?.tier     ?? "INTIMATE";
    const deviceCap = parseInt(session.metadata?.deviceCap ?? "5", 10);
    const rawGuests = session.metadata?.guestList;          // JSON string or undefined

    if (!projectId) {
      console.warn("[webhook] checkout.session.completed has no giftId in metadata");
      return NextResponse.json({ received: true });
    }

    // Only recognised paid tiers are accepted — guards against stale metadata.
    const tier = rawTier === "EVENT" ? "EVENT" : "INTIMATE";

    // Parse the guest list that was embedded by the checkout route.
    let guestList: string[] = [];
    if (tier === "EVENT" && rawGuests) {
      try {
        const parsed = JSON.parse(rawGuests);
        if (Array.isArray(parsed)) {
          guestList = parsed.filter((n): n is string => typeof n === "string");
        }
      } catch {
        console.warn("[webhook] Failed to parse guestList metadata");
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).project.update({
        where: { id: projectId },
        data: {
          isPaid:       true,
          isPublished:  "PUBLISHED",
          tier,
          deviceCap:    isNaN(deviceCap) ? 5 : deviceCap,
          // Inject verified guest data so the bouncer gate is ready immediately.
          ...(tier === "EVENT" && {
            guestList,
            claimedNames: [],   // reset claimed seats on each successful purchase
          }),
        },
      });
    } catch (err) {
      console.error("[webhook] Failed to fulfil project:", projectId, err);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
