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

export const APP_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ${CLERK}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${CLERK} wss://*.clerk.accounts.dev https://clerk-telemetry.com https://api.stripe.com`,
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com ${CLERK} https://maps.google.com https://www.youtube.com https://player.vimeo.com https://open.spotify.com`,
  "media-src 'self' blob: data: https://replicate.delivery https://www.soundhelix.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://hooks.stripe.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

// ── Wedding invite policy ─────────────────────────────────────────────────────
// Every host below maps to a real reference in public/wedding-demo/index.html.
//   script-src  cdn.jsdelivr.net — canvas-confetti + intl-tel-input (and its
//               lazily-injected utils.js); 'unsafe-inline' for the inline
//               intlTelInput bootstrap at index.html:261
//   style-src   fonts.googleapis.com (Cormorant Garamond + Quicksand),
//               cdnjs.cloudflare.com (Font Awesome), cdn.jsdelivr.net (intl-tel-input)
//   font-src    fonts.gstatic.com (Google webfonts) + cdnjs (Font Awesome glyphs)
//   img-src     cdn.jsdelivr.net — intl-tel-input country flag sprites
//   connect-src hook.eu1.make.com — the RSVP webhook (app.js:446). Without this,
//               guests get a silent "Confirm Attendance" failure.
//   media-src   'self' — background-music.mp3 / voice-note.mp3 are served locally
//   frame-src   'none' — the page has no iframes; Maps/Calendar use window.open
// Deliberately NO 'unsafe-eval' and no Clerk/Stripe/Supabase hosts: this page
// has no session and must never be able to reach the app's auth or billing APIs.
const JSDELIVR = "https://cdn.jsdelivr.net";

export const WEDDING_CSP = [
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
