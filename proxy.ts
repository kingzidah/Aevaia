// ── Next.js 16 proxy — replaces the deprecated middleware.ts convention ───────
// Export name must be `proxy` (or `default`); Next.js 16 loads this via
// the PROXY_FILENAME ("proxy") convention and ignores any middleware.ts present.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { STATIC_SITES, STATIC_SITE_CSP } from "./lib/csp";

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
  "/monitoring",                // Sentry tunnel (tunnelRoute in next.config.ts).
                                // Must stay public: errors from signed-out
                                // visitors on /p/* are exactly the ones worth
                                // capturing, and an authed tunnel drops them
                                // silently. Write-only proxy to Sentry — it
                                // exposes no app data.
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
  "/monitoring",      // error reporting must survive maintenance mode — an
                      // outage is when you most need the errors
]);

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
  // ── Standalone static site rewrites ─────────────────────────────────────────
  // Serves each entry in STATIC_SITES (the wedding invite, Jasmine's birthday
  // page) from its own directory under public/, keyed on hostname — e.g.
  // opeyemianduriel.aevaia.com → public/wedding-demo/, jasmine.aevaia.com →
  // public/jasmine/. Also works locally via <name>.localhost:3000.
  //
  // This runs OUTSIDE clerkMiddleware on purpose. Both rewrites previously lived
  // inside the Clerk handler with a comment claiming Clerk never ran — it did.
  // clerkMiddleware wraps the callback, so its handshake fired first and bounced
  // every visitor through a `?__clerk_handshake=…` 307 before the page rendered:
  // extra latency on first load, plus Clerk session cookies set on domains that
  // have no accounts. Short-circuiting here means these pages touch no auth.
  const hostname = req.headers.get("host") ?? "";
  const site = STATIC_SITES.find((s) => hostname.includes(s.hostMatch));

  if (site) {
    let newPath = req.nextUrl.pathname;
    if (newPath === "/") newPath = "/index.html";
    if (!newPath.startsWith(site.dir)) {
      newPath = site.dir + newPath;
    }
    req.nextUrl.pathname = newPath;

    const res = NextResponse.rewrite(req.nextUrl);
    // Belt-and-braces: next.config.ts already applies STATIC_SITE_CSP by host,
    // but set it here too so these pages are never served under the app's
    // stricter policy if that host rule is ever edited. Same string, so no
    // conflicting second header (browsers intersect duplicate CSP headers).
    res.headers.set("Content-Security-Policy", STATIC_SITE_CSP);
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
