import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/checkout
// Creates a Stripe Checkout session for a 500-credit top-up.
// The buyer's Clerk id is stamped into session metadata so the webhook can
// attribute the credits to the correct account after payment completes.
export async function POST(request: Request) {
  // ── Auth: only signed-in users may open a checkout (defence in depth; the
  // proxy also gates this route). Prevents anonymous abuse of Stripe session
  // creation and gives the webhook a userId to credit. ──────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  // ── Rate limit: 10 checkout sessions per user per minute ──────────────────
  const rl = await rateLimit(`checkout:${userId}`, { limit: 10, windowMs: 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";
  const stripe = new Stripe(stripeKey);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Bind the purchase to the authenticated buyer so fulfilment is attributable.
    client_reference_id: userId,
    metadata:            { userId, product: "credit-topup-500" },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: "500 Credit Top-Up", description: "500 Aevaia AI generation credits" },
          unit_amount: 499,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?success=true`,
    cancel_url:  `${origin}/studio`,
  });

  return NextResponse.json({ url: session.url });
}
