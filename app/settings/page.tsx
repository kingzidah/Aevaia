// Settings — guarded by Clerk auth (auth() throws/redirects for unauthenticated users).
// Profile and password management is delegated to Clerk's <UserProfile /> component.
// Billing data is fetched server-side and passed to the client for the Stripe portal link.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/settings/SettingsClient";

export const metadata = { title: "Account Settings — HeartCraft" };

export default async function SettingsPage() {
  const { userId } = await auth();

  // Middleware handles the redirect, but guard here for defence-in-depth.
  if (!userId) redirect("/sign-in");

  // Subscription and tier both use the Clerk userId directly (no local User row needed).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subscription, paidProject] = await Promise.all([
    (prisma as any).subscription.findUnique({
      where:  { userId },
      select: { status: true, stripeCustomerId: true },
    }),
    (prisma as any).project.findFirst({
      where:   { userId, isPaid: true },
      select:  { tier: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <SettingsClient
      subscriptionStatus={subscription?.status ?? "INACTIVE"}
      tier={paidProject?.tier ?? "FREE"}
      hasStripeCustomer={!!subscription?.stripeCustomerId}
    />
  );
}
