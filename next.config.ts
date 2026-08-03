import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";
import { APP_CSP, STATIC_SITE_CSP, STATIC_SITE_HOST_REGEX } from "./lib/csp";

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
];

const securityHeaders = [
  ...baseSecurityHeaders,
  { key: "Content-Security-Policy", value: APP_CSP },
];

// Same transport/framing protections, different CSP. See lib/csp.ts for why the
// standalone static sites need their own policy instead of widening the app's.
const staticSiteHeaders = [
  ...baseSecurityHeaders,
  { key: "Content-Security-Policy", value: STATIC_SITE_CSP },
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
    // each static site is served at "/" on its own host via a proxy.ts rewrite —
    // so its document arrives here as "/", never as "/wedding-demo/index.html".
    // A path rule would therefore miss the very page it exists to cover.
    // (Verified by probing both paths against dev.)
    //
    // The has/missing pair below is mutually exclusive, which matters: Next.js
    // merges ALL matching header rules, and a browser handed two CSP headers
    // enforces their intersection — silently re-blocking the CDNs the static
    // site policy deliberately allows.
    //
    // The host pattern is derived from STATIC_SITES in lib/csp.ts, so adding a
    // site there updates routing and headers together.
    const onStaticSiteHost = [
      { type: "host" as const, value: STATIC_SITE_HOST_REGEX },
    ];

    return [
      // The standalone static sites — documents and assets alike.
      {
        source: "/:path*",
        has: onStaticSiteHost,
        headers: staticSiteHeaders,
      },
      // The HeartCraft app itself.
      {
        source: "/:path*",
        missing: onStaticSiteHost,
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Read from the environment so the org/project can differ per deploy target
  // and this file never carries a stale slug. These are build-time only (they
  // drive source map upload), not runtime secrets.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Build-time secret, separate from the DSN. Without it the build still
  // succeeds but source maps are not uploaded, so production stack traces stay
  // minified. Set SENTRY_AUTH_TOKEN in Vercel (and CI) to get readable frames.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Uploads a wider set of client files so browser stack traces resolve.
  widenClientFileUpload: true,

  // Routes Sentry events through this app's own origin instead of straight to
  // Sentry. Two reasons that matter here: it survives ad-blockers, and it means
  // the strict CSP's `connect-src 'self'` already covers the main event path.
  //
  // IMPORTANT: /monitoring is added to the public-route allowlist in proxy.ts —
  // without that, Clerk would gate the tunnel and every event from a
  // signed-out visitor (the whole public gift viewer) would silently fail.
  tunnelRoute: "/monitoring",

  // Keep local builds quiet; full output in CI.
  silent: !process.env.CI,

  // NOTE: no `webpack.treeshake` options — this project builds with Turbopack,
  // where those settings do nothing.
});
