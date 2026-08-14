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
  "/api/waitlist",   // landing-page waitlist signup — visitors have no accounts
  "/api/enquiry",    // landing-page "build it for me" enquiry, same reason
  "/api/wedding/rsvp",     // wedding invite RSVP — guests have no accounts
  "/api/wedding/check-in", // gate scanner; guarded by its own staff PIN,
                           // not by Clerk (bouncers have no accounts)
  "/api/wedding/lookup",   // find a guest by name at the gate, same PIN
  "/api/wedding/stats",    // live checked-in count for the scanner header
  "/wedding/scan",         // the scanner PAGE itself. Bouncers are venue staff
                           // with no Clerk accounts, so protecting this with
                           // auth makes it unreachable by the only people who
                           // need it. Safe to expose: the page ships no guest
                           // data — it is an empty shell until a correct PIN is
                           // entered, and every check-in is verified server-side
                           // against WEDDING_GATE_PIN with its own lockout.
  "/gift/(.*)",       // legacy gift viewer
  "/privacy",
  "/terms",
  "/contact",
  "/impressum",       // operator disclosure. Must be reachable WITHOUT an
                      // account — an Impressum behind a login does not satisfy
                      // the duty it exists to meet. Omitting it here is what
                      // made /wedding/scan 404 for signed-out visitors.
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
  // ── Wedding subdomain rewrite ───────────────────────────────────────────────
  // Serves public/wedding-demo/ as a standalone static site on any hostname
  // that contains "opeyemianduriel" (e.g. opeyemianduriel.localhost:3000 or
  // opeyemianduriel.aevaia.com). Returns before auth so Clerk never runs.
  const hostname = req.headers.get('host') ?? '';

  // /api/* is deliberately NOT rewritten, even on a subdomain host. Both
  // rewrites below prefix every path with the site's directory, so without this
  // an in-page fetch("/api/wedding/rsvp") from the invite would become
  // /wedding-demo/api/wedding/rsvp and 404 — the RSVP would fail silently for
  // every guest. Falling through lets those calls reach the real route
  // handlers, still subject to the public-route allowlist above.
  const isApiRequest = req.nextUrl.pathname.startsWith('/api/');

  if (!isApiRequest && hostname.includes('opeyemianduriel')) {
    let newPath = req.nextUrl.pathname;
    if (newPath === '/') newPath = '/index.html';
    if (!newPath.startsWith('/wedding-demo')) {
      newPath = '/wedding-demo' + newPath;
    }
    req.nextUrl.pathname = newPath;
    return NextResponse.rewrite(req.nextUrl);
  }

  // ── Jasmine subdomain rewrite ───────────────────────────────────────────────
  // Serves public/jasmine/ as a standalone static site on any hostname that
  // contains "jasmine" (e.g. jasmine.localhost:3000 or jasmine.aevaia.com).
  // Returns before auth so Clerk never runs. Mirrors the wedding-demo rewrite.
  if (!isApiRequest && hostname.includes('jasmine')) {
    let newPath = req.nextUrl.pathname;
    if (newPath === '/') newPath = '/index.html';
    if (!newPath.startsWith('/jasmine')) {
      newPath = '/jasmine' + newPath;
    }
    req.nextUrl.pathname = newPath;
    return NextResponse.rewrite(req.nextUrl);
  }

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
