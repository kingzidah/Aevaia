import type { NextConfig } from "next";
import path from "path";

// ── Content Security Policy (ENFORCED) ────────────────────────────────────────
// Every allowed source below maps to a real dependency the app loads in the
// browser. Anything not listed is blocked. To roll back to observe-only, change
// the header key at the bottom of this file back to
// "Content-Security-Policy-Report-Only".
//
// Per-directive rationale (host list derived from a full source audit):
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
const CLERK  = "https://*.clerk.accounts.dev https://*.clerk.com";
const ContentSecurityPolicy = [
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

// ── Enforced security headers ─────────────────────────────────────────────────
const securityHeaders = [
  // Blocks MIME-type sniffing (e.g. serving a text/plain file as JavaScript)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevents the app from being embedded in iframes (legacy browser fallback;
  // frame-ancestors in CSP handles modern browsers)
  { key: "X-Frame-Options", value: "DENY" },
  // Sends the full URL as Referer within the same origin; only the origin across origins
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disables browser features HeartCraft does not use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
  },
  // Forces HTTPS for 2 years and includes subdomains in the preload list.
  // Safe on Vercel (always HTTPS); remove if you need to serve over HTTP locally.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // CSP ENFORCED. To revert to observe-only, change the key back to
  // "Content-Security-Policy-Report-Only".
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray package-lock.json in the
  // user home directory otherwise makes Turbopack infer C:\Users\<user> as the
  // root, which silently breaks route discovery (pages and /api/* return 404).
  turbopack: {
    root: path.join(__dirname),
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
