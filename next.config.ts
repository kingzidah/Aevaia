import type { NextConfig } from "next";

// ── Content Security Policy (REPORT-ONLY) ─────────────────────────────────────
// Violations are logged to the browser console but NOT enforced.
// Review the console for blocked resources before switching the header key to
// "Content-Security-Policy" to enable enforcement.
//
// Notes on individual directives:
//   script-src  'unsafe-inline' — required by Next.js for hydration scripts
//   script-src  'unsafe-eval'   — required by Next.js dev tooling; audit in prod
//   style-src   'unsafe-inline' — Tailwind and canvas editor inline styles
//   img-src     https:          — gallery blocks load external images
//   connect-src Clerk endpoints — client-side auth state polling via FAPI
//   connect-src api.stripe.com  — client-side payment intent creation
//   frame-src   Stripe          — 3-D Secure iframes during checkout
//   worker-src  blob:           — canvas editor web workers
//   media-src   blob: data:     — audio/video blocks in the sensory engine
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev wss://*.clerk.accounts.dev https://api.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
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
  // CSP in REPORT-ONLY — change key to "Content-Security-Policy" to enforce.
  {
    key: "Content-Security-Policy-Report-Only",
    value: ContentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
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
