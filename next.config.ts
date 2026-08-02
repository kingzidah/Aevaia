import type { NextConfig } from "next";
import path from "path";
import { APP_CSP, WEDDING_CSP } from "./lib/csp";

// ── Enforced security headers ─────────────────────────────────────────────────
// The CSP strings themselves live in lib/csp.ts so proxy.ts can reuse them.
// To roll CSP back to observe-only, change the "Content-Security-Policy" key
// below (and the one in proxy.ts) to "Content-Security-Policy-Report-Only".
const baseSecurityHeaders = [
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
];

const securityHeaders = [
  ...baseSecurityHeaders,
  { key: "Content-Security-Policy", value: APP_CSP },
];

// Same transport/framing protections, different CSP. See lib/csp.ts for why the
// wedding invite needs its own policy instead of widening the app's.
const weddingHeaders = [
  ...baseSecurityHeaders,
  { key: "Content-Security-Policy", value: WEDDING_CSP },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray package-lock.json in the
  // user home directory otherwise makes Turbopack infer C:\Users\<user> as the
  // root, which silently breaks route discovery (pages and /api/* return 404).
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    // CSP is split by HOST, not by path.
    //
    // Why host and not path: headers() matches the INCOMING request path, and
    // the invite is served at "/" on the opeyemianduriel.* host via a proxy.ts
    // rewrite — so its document arrives here as "/", never as
    // "/wedding-demo/index.html". A path rule would therefore miss the very page
    // it exists to cover. (Verified by probing both paths against dev.)
    //
    // The has/missing pair below is mutually exclusive, which matters: Next.js
    // merges ALL matching header rules, and a browser handed two CSP headers
    // enforces their intersection — silently re-blocking the CDNs the wedding
    // policy deliberately allows.
    const onWeddingHost = [
      { type: "host" as const, value: ".*opeyemianduriel.*" },
    ];

    return [
      // The standalone wedding invite — document and static assets alike.
      {
        source: "/:path*",
        has: onWeddingHost,
        headers: weddingHeaders,
      },
      // The HeartCraft app itself.
      {
        source: "/:path*",
        missing: onWeddingHost,
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
