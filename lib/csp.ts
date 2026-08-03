// ── Content Security Policies — single source of truth ────────────────────────
// Imported by BOTH next.config.ts (static header rules) and proxy.ts (the
// wedding subdomain rewrite). Keep it dependency-free: next.config.ts loads this
// at config time, before any Next.js runtime exists, so it must stay plain
// strings with no imports.
//
// Two policies are exported:
//   APP_CSP      — the locked-down policy for the authenticated HeartCraft app
//   WEDDING_CSP  — a separate policy for the standalone static wedding invite
//
// WHY TWO: the wedding invite (public/wedding-demo) is a self-contained page
// served on the opeyemianduriel.* subdomain. It loads third-party CDN assets the
// main app does not use. Folding those CDNs into APP_CSP would make them valid
// script sources inside the studio too, turning a static invite's dependencies
// into an XSS surface on pages holding Clerk sessions and Stripe state.
//
// IMPORTANT: a browser given two Content-Security-Policy headers enforces the
// INTERSECTION (strictest wins). Exactly one of these must reach any response —
// see the routing notes in next.config.ts and proxy.ts.

// ── App policy ────────────────────────────────────────────────────────────────
// Every allowed source maps to a real dependency the app loads in the browser.
//   script-src   'unsafe-inline'/'unsafe-eval' — required by Next.js hydration
//                + js.stripe.com (Stripe.js) + *.clerk.* (Clerk auth SDK)
//   style-src    'unsafe-inline' — Tailwind + canvas editor inline styles
//   img-src      https: — gallery/template/AI images from arbitrary CDNs
//   connect-src  Clerk FAPI + telemetry, Stripe API; app talks to its own
//                origin ('self'). Replicate/OpenRouter/Supabase are server-only.
//   frame-src    Stripe (3-DS), Clerk (auth), and the embeddable media blocks
//                a creator can add to a gift (YouTube, Vimeo, Spotify, Maps)
//   media-src    AI audio/voice (replicate.delivery) + soundscape loops
//   worker-src   blob: — canvas editor + Clerk web workers
//   object-src 'none' / base-uri 'self' / frame-ancestors 'none' — hard denies
const CLERK = "https://*.clerk.accounts.dev https://*.clerk.com";

// Sentry ingest for the geoland-pro org, which lives in Sentry's EU region —
// hence `.de.` and NOT the more commonly documented `*.ingest.sentry.io`.
//
// Events normally travel through the same-origin tunnel (`tunnelRoute:
// "/monitoring"` in next.config.ts), which `connect-src 'self'` already covers.
// This host is listed as well so a tunnel miss degrades into a direct send
// rather than a silently dropped event — the failure mode CSP is worst at,
// because a blocked error report is invisible by definition.
const SENTRY_INGEST = "https://*.ingest.de.sentry.io";

export const APP_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ${CLERK}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${CLERK} wss://*.clerk.accounts.dev https://clerk-telemetry.com https://api.stripe.com ${SENTRY_INGEST}`,
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com ${CLERK} https://maps.google.com https://www.youtube.com https://player.vimeo.com https://open.spotify.com`,
  "media-src 'self' blob: data: https://replicate.delivery https://www.soundhelix.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://hooks.stripe.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

// ── Standalone static sites ───────────────────────────────────────────────────
// Personal one-off pages served from public/ on their own subdomains. They are
// not part of the app: no Clerk session, no Stripe, no database — just HTML,
// CSS, and a little vanilla JS.
//
// This table is the single source of truth for BOTH the rewrite in proxy.ts and
// the host-based header rule in next.config.ts. Adding a site here wires up its
// routing and its CSP together, so the two can never drift apart — which is the
// bug that would otherwise ship a new invite with the app's policy and no fonts.
export const STATIC_SITES = [
  // Opeyemi & Uriel's wedding invitation
  { hostMatch: "opeyemianduriel", dir: "/wedding-demo" },
  // Jasmine's birthday gift
  { hostMatch: "jasmine", dir: "/jasmine" },
] as const;

// Regex fragment for next.config.ts `has: [{ type: "host" }]` matching.
export const STATIC_SITE_HOST_REGEX = `.*(${STATIC_SITES.map(
  (s) => s.hostMatch,
).join("|")}).*`;

// ── Static site policy ────────────────────────────────────────────────────────
// One policy shared by every site in STATIC_SITES. They load the same handful of
// CDNs, and a single policy is far less likely to rot than one per site.
//
// Each host maps to a real reference in those pages:
//   script-src  cdn.jsdelivr.net — canvas-confetti + intl-tel-input (plus its
//               lazily-injected utils.js); 'unsafe-inline' for the inline
//               bootstrap scripts both pages use
//   style-src   fonts.googleapis.com (Cormorant Garamond, Quicksand),
//               cdnjs.cloudflare.com (Font Awesome), cdn.jsdelivr.net
//   font-src    fonts.gstatic.com (Google webfonts) + cdnjs (Font Awesome glyphs)
//   img-src     cdn.jsdelivr.net — intl-tel-input country flag sprites
//   connect-src hook.eu1.make.com — the wedding RSVP webhook. Without it guests
//               get a silent "Confirm Attendance" failure. The Jasmine page makes
//               no network calls at all, so this is unused there and harmless:
//               a static page with no session has nothing to exfiltrate.
//   media-src   'self' — Jasmine's song files are served locally from public/
//   frame-src   'none' — neither page uses iframes; Maps/Calendar use window.open
//
// Deliberately NO 'unsafe-eval', and no Clerk/Stripe/Supabase/Sentry hosts:
// these pages have no session and must never reach the app's auth, billing, or
// telemetry endpoints.
const JSDELIVR = "https://cdn.jsdelivr.net";

export const STATIC_SITE_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${JSDELIVR}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com ${JSDELIVR}`,
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  `img-src 'self' data: blob: ${JSDELIVR}`,
  `connect-src 'self' https://hook.eu1.make.com ${JSDELIVR}`,
  "media-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
].join("; ");
