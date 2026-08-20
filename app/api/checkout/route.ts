import { NextResponse } from "next/server";
import Stripe from "stripe";
import { studioDisabledResponse } from "@/lib/studio-gate";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

export async function POST(request: Request) {
  // Studio is not launched. These routes spend real money or move money and
  // were reachable without authentication — see lib/studio-gate.ts.
  const disabled = studioDisabledResponse();
  if (disabled) return disabled;

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
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
