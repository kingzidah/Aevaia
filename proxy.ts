// ── Next.js 16 proxy — replaces the deprecated middleware.ts convention ───────
// Export name must be `proxy` (or `default`); Next.js 16 loads this via
// the PROXY_FILENAME ("proxy") convention and ignores any middleware.ts present.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  "/gift/(.*)",       // legacy gift viewer
  "/privacy",
  "/terms",
  "/contact",
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  // Auth is intentionally skipped in development so the studio is usable
  // without Clerk keys configured locally. Production always enforces.
  if (process.env.NODE_ENV === "development") return;

  if (!isPublicRoute(req)) {
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
