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
  "/start",           // commission brief. The entire point is that a client
                      // never makes an account, so this must be public — and it
                      // is pasted into DMs, where a 404 reads as a dead scam
                      // link rather than a misconfiguration.
  "/api/commission",  // the write behind it, same reason.
  "/demo(.*)",        // the portfolio demos. These are marketing — the whole
                      // point is that a stranger can open them without an
                      // account — and they are what the home page links to.
  "/robots.txt",      // crawler directives, and the sitemap pointer.
  "/sitemap.xml",     // Both were 404 in production: neither extension was
                      // excluded by the matcher below, so Clerk protected them
                      // and no search engine could read either one.
]);

// Routes that must remain reachable during maintenance so the admin can log in
// and so external services (Stripe, Clerk) can still call our webhooks.
// The unlaunched Studio surfaces. Kept in one place so nothing is missed.
const isStudioRoute = createRouteMatcher([
  "/studio(.*)",
  "/workspace(.*)",
  "/dashboard(.*)",
]);

// Pages that require a session. Everything else that is not on the public
// allowlist falls through to Next.js, which renders the branded 404 for a path
// that does not exist. See the enforcement block below for why.
const isPrivatePage = createRouteMatcher([
  "/admin(.*)",
  "/dashboard(.*)",
  "/settings(.*)",
  "/studio(.*)",
  "/workspace(.*)",
]);

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

  // ── Yvana subdomain rewrite ─────────────────────────────────────────────────
  // Serves public/yvana/ as a standalone static site on any hostname containing
  // "yvana" (yvana.aevaia.com, or yvana.localhost:3000). Mirrors the jasmine
  // and wedding rewrites; returns before auth so Clerk never runs.
  if (!isApiRequest && hostname.includes('yvana')) {
    let newPath = req.nextUrl.pathname;
    if (newPath === '/') newPath = '/index.html';
    if (!newPath.startsWith('/yvana')) {
      newPath = '/yvana' + newPath;
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

  // ── Studio lockdown ─────────────────────────────────────────────────────────
  // The self-serve Studio is unfinished and unlaunched. Nothing on the marketing
  // site links to it, but sign-up is open, so anyone who created an account
  // could walk straight into it by typing the path. Owner only until it ships.
  //
  // Redirects rather than 404s so the owner is not confused by a dead route, and
  // so a signed-out visitor lands somewhere useful instead of nowhere.
  if (isStudioRoute(req)) {
    const { userId } = await auth();
    const ownerId = process.env.ADMIN_USER_ID ?? process.env.MAINTENANCE_BYPASS_USER_ID ?? "";
    // Fails CLOSED: with no owner configured nobody gets in, rather than
    // defaulting to "any signed-in user".
    if (!ownerId || !userId || userId !== ownerId) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ── Normal auth enforcement (production only) ───────────────────────────────
  // In development, session processing still runs (so auth() works in route
  // handlers) but protect() enforcement is skipped — this lets the studio be
  // used without requiring a production sign-in flow locally.
  //
  // API routes stay DENY-BY-DEFAULT: anything not on the public allowlist above
  // requires a session. Most of them write data, and a new route added without
  // a moment's thought about auth should fail closed rather than open.
  //
  // Page routes are the exception, and only because deny-by-default was
  // producing a worse outcome than it prevented: a mistyped URL — and this site
  // is built to be pasted into WhatsApp, where links get mangled — was not
  // reaching the 404 page. It was non-public, so protect() bounced the visitor
  // to a Clerk sign-in screen titled "My Application", asking a stranger to log
  // into a product that is not for sale. Unknown paths now fall through to the
  // branded 404.
  //
  // The private pages are enumerated rather than inferred. The full page route
  // table is: /, /contact, /impressum, /privacy, /terms, /start, /maintenance,
  // /sign-in, /sign-up, /p/[id], /gift/[id], /wedding/scan — all public by
  // design — plus the five below. Add a private page and add it here too.
  if (process.env.NODE_ENV !== "development" && !isPublicRoute(req)) {
    if (req.nextUrl.pathname.startsWith("/api/") || isPrivatePage(req)) {
      await auth.protect();
    }
  }
});

// Run on every request except Next.js internals and static assets so Clerk
// can hydrate the session on all protected pages and API routes.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|m?js(?!on)|jpe?g|webp|avif|png|gif|svg|ttf|woff2?|ico|csv|txt|xml|mp3|mp4|m4a|wav|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
