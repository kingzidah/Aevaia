// ── Next.js 16 proxy — replaces the deprecated middleware.ts convention ───────
// Export name must be `proxy` (or `default`); Next.js 16 loads this via
// the PROXY_FILENAME ("proxy") convention and ignores any middleware.ts present.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { WEDDING_CSP } from "./lib/csp";

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
//
// SECURITY — patterns are matched by path-to-regexp and are PREFIX-greedy, so a
// pattern like "/api/gift(.*)" also matches "/api/gifts/list". Every entry here
// is therefore anchored as tightly as possible so it exposes ONLY the intended
// endpoint and never accidentally whitelists a sibling route (e.g. /api/gifts/*).
const isPublicRoute = createRouteMatcher([
  "/",                          // landing page
  "/p/(.*)",                    // public gift viewer
  "/sign-in(.*)",               // Clerk hosted sign-in
  "/sign-up(.*)",               // Clerk hosted sign-up
  "/api/webhook",               // Stripe webhook (signature-verified)
  "/api/webhooks/(.*)",         // Clerk/svix webhooks (signature-verified)
  "/api/gift/check-in",         // guest device check-in (runs pre-auth on viewer)
  "/api/rsvp",                  // RSVP links shared with unauthenticated guests
  "/gift/(.*)",                 // legacy gift viewer
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

// Hostname that serves the standalone wedding invite. Kept as a constant so the
// value stays in step with the host matcher in next.config.ts headers().
const WEDDING_HOST_MATCH = "opeyemianduriel";

const clerkHandler = clerkMiddleware(async (auth, req) => {
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

export function proxy(req: NextRequest, event: NextFetchEvent) {
  // ── Wedding subdomain rewrite ───────────────────────────────────────────────
  // Serves public/wedding-demo/ as a standalone static site on any hostname
  // containing "opeyemianduriel" (e.g. opeyemianduriel.localhost:3000 or
  // opeyemianduriel.aevaia.com).
  //
  // This runs OUTSIDE clerkMiddleware on purpose. Previously the host check
  // lived inside the Clerk handler, which does not skip Clerk: clerkMiddleware
  // wraps the callback, so its handshake ran first and bounced every guest
  // through a `?__clerk_handshake=…` 307 before the invite rendered — extra
  // latency on first load, plus Clerk session cookies set on a domain that has
  // no accounts. Short-circuiting here means the invite touches no auth at all.
  const hostname = req.headers.get("host") ?? "";
  if (hostname.includes(WEDDING_HOST_MATCH)) {
    let newPath = req.nextUrl.pathname;
    if (newPath === "/") newPath = "/index.html";
    if (!newPath.startsWith("/wedding-demo")) {
      newPath = "/wedding-demo" + newPath;
    }
    req.nextUrl.pathname = newPath;

    const res = NextResponse.rewrite(req.nextUrl);
    // Belt-and-braces: next.config.ts already applies WEDDING_CSP by host, but
    // set it here too so the invite is never served under the app's stricter
    // policy if that host rule is ever edited. Same string, so no conflicting
    // second header (browsers intersect duplicate CSP headers).
    res.headers.set("Content-Security-Policy", WEDDING_CSP);
    return res;
  }

  return clerkHandler(req, event);
}

// Run on every request except Next.js internals and static assets so Clerk
// can hydrate the session on all protected pages and API routes.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
