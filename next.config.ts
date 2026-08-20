import type { NextConfig } from "next";

// ── Content Security Policy (ENFORCED) ───────────────────────────────────────
// Previously shipped as Content-Security-Policy-Report-Only, so it blocked
// nothing. Worse, the policy as written did not describe this application: had
// it been switched to enforcing as-is, it would have broken Clerk sign-in
// everywhere (its script host was never allowed) and stripped the fonts,
// confetti and phone-number field from the client wedding invites, which load
// from jsDelivr, Google Fonts and cdnjs. Every host below was found by reading
// what the pages actually request, not by guesswork:
//
//   grep -rhoE '<script[^>]*src="https?://[^"]+"' public/
//
// If you add a library from a new CDN to a client site, add its host here or
// the browser will silently refuse to load it.
//
// Notes on individual directives:
//   script-src  'unsafe-inline' — required by Next.js for hydration scripts
//   script-src  'unsafe-eval'   — required by Next.js dev tooling; audit in prod
//   script-src  clerk hosts     — Clerk loads clerk.browser.js from its FAPI
//                                 domain. That is *.clerk.accounts.dev on the
//                                 current development keys and clerk.aevaia.com
//                                 once production keys are switched on; both are
//                                 listed so the switch does not break auth.
//   script-src  jsdelivr        — canvas-confetti, intl-tel-input on the invites
//   script-src  vercel-scripts  — Web Analytics in development. In production
//                                 the script is same-origin (/_vercel/insights).
//   style-src   'unsafe-inline' — Tailwind and canvas editor inline styles
//   style-src   fonts/cdnjs     — Google Fonts and Font Awesome on the invites
//   font-src    gstatic/cdnjs   — the webfont files those stylesheets pull in
//   img-src     https:          — gallery blocks load external images
//   connect-src Clerk endpoints — client-side auth state polling via FAPI
//   connect-src api.stripe.com  — client-side payment intent creation
//   frame-src   Stripe          — 3-D Secure iframes during checkout
//   frame-src   turnstile       — Clerk's bot check renders in a frame
//   worker-src  blob:           — canvas editor web workers
//   media-src   blob: data:     — audio/video blocks in the sensory engine
//
// calendar.google.com is deliberately absent: the invites link out to it for
// "add to calendar", and a top-level navigation is not a subresource.
const CLERK_HOSTS = "https://*.clerk.accounts.dev https://clerk.aevaia.com";

const ContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ${CLERK_HOSTS} https://challenges.cloudflare.com https://cdn.jsdelivr.net https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  `connect-src 'self' ${CLERK_HOSTS} wss://*.clerk.accounts.dev wss://clerk.aevaia.com https://api.stripe.com https://va.vercel-scripts.com https://cdn.jsdelivr.net`,
  "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://hooks.stripe.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob: data:",
  "manifest-src 'self'",
].join("; ");

// ── Enforced security headers ─────────────────────────────────────────────────
const securityHeaders = [
  // Blocks MIME-type sniffing (e.g. serving a text/plain file as JavaScript)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevents the app from being embedded in iframes (legacy browser fallback;
  // frame-ancestors in CSP handles modern browsers)
  { key: "X-Frame-Options", value: "DENY" },
  // Sends the full URL as Referer within the same origin; only the origin across origins
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disables browser features HeartCraft does not use.
  // camera=(self) — required by the gate scanner at /wedding/scan, which reads
  // guest QR codes through getUserMedia. `camera=()` blocks the camera for ALL
  // origins including our own, so the scanner would fail to start with a
  // NotAllowedError and no obvious cause. Scoped to self only.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(self), usb=()",
  },
  // Forces HTTPS for 2 years and includes subdomains in the preload list.
  // Safe on Vercel (always HTTPS); remove if you need to serve over HTTP locally.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Enforced. Verify in a real browser after changing it — a CSP mistake is
  // invisible in the build and in curl, and only shows up as a missing font or
  // a dead button on someone else's phone.
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  // Pin the workspace root. A stray package-lock.json in the home directory
  // (C:\Users\tayoa) makes Turbopack infer THAT as the root, which resolves
  // routes against the wrong tree — `next dev` then hangs or 404s every route.
  // Pinning it here keeps resolution inside this repo regardless of what else
  // is lying around above it.
  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
