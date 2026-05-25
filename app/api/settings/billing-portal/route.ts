import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = await (prisma as any).subscription.findUnique({
    where:  { userId },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing record found" }, { status: 404 });
  }

  const stripe  = new Stripe(stripeKey);
  const origin  = request.headers.get("origin") ?? "https://heartcraft.app";

  const portal = await stripe.billingPortal.sessions.create({
    customer:   subscription.stripeCustomerId,
    return_url: `${origin}/settings`,
  });

  return NextResponse.json({ url: portal.url });
}
