// ── Next.js 16 proxy — replaces the deprecated middleware.ts convention ───────
// Export name must be `proxy` (or `default`); Next.js 16 loads this via
// the PROXY_FILENAME ("proxy") convention and ignores any middleware.ts present.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Startup assertion: fail loudly if NODE_ENV is missing or unrecognised so the
// auth layer never silently misconfigures itself on a custom/misconfigured host.
// On Vercel, Next.js always sets this; this guard catches Docker/VPS deploys.
const _env = process.env.NODE_ENV;
if (_env !== "development" && _env !== "production" && _env !== "test") {
  throw new Error(
    `[proxy] NODE_ENV="${_env}" is not a recognised value. ` +
    `Auth enforcement requires NODE_ENV to be explicitly "production", ` +
    `"development", or "test". The server will not start with an ambiguous auth posture.`
  );
}

// Explicit public-route allowlist — everything else is authenticated.
const isPublicRoute = createRouteMatcher([
  "/",               // landing page
  "/p(.*)",          // public gift viewer
  "/sign-in(.*)",    // Clerk hosted sign-in
  "/sign-up(.*)",    // Clerk hosted sign-up
  "/api/webhook(.*)", // Stripe / Clerk webhooks (signed separately)
  "/api/gift(.*)",    // gift check-in (runs pre-auth on the viewer)
  "/api/rsvp(.*)",   // RSVP links shared with unauthenticated guests
  "/gift/(.*)",       // legacy gift viewer
  "/privacy",
  "/terms",
  "/contact",
]);

// Routes that must remain reachable during maintenance so the admin can log in
// and so external services (Stripe, Clerk) can still call our webhooks.
const isMaintenanceExempt = createRouteMatcher([
  "/maintenance",     // the page itself — must never self-redirect
  "/sign-in(.*)",     // admin must be able to authenticate
  "/sign-up(.*)",
  "/api/webhook(.*)", // Stripe / Clerk webhooks must never be blocked
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  // ── Maintenance mode ────────────────────────────────────────────────────────
  // Activated by setting MAINTENANCE_MODE=true in .env.local (or Vercel env).
  // The owner bypasses the redirect by setting MAINTENANCE_BYPASS_USER_ID to
  // their Clerk user ID (found in Clerk Dashboard → Users → copy the user_… ID).
  if (process.env.MAINTENANCE_MODE === "true" && !isMaintenanceExempt(req)) {
    const { userId } = await auth();
    const bypassId   = process.env.MAINTENANCE_BYPASS_USER_ID;

    // Allow through only when both values are set and match exactly.
    const isOwner = Boolean(bypassId && userId && userId === bypassId);

    if (!isOwner) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  // ── Normal auth enforcement (production only) ───────────────────────────────
  // In development, session processing still runs (so auth() works in route
  // handlers) but protect() enforcement is skipped — this lets the studio be
  // used without requiring a production sign-in flow locally.
  if (process.env.NODE_ENV !== "development" && !isPublicRoute(req)) {
    await auth.protect();
  }
});

// Run on every request except Next.js internals and static assets so Clerk
// can hydrate the session on all protected pages and API routes.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
