// ── Sentry — browser/client runtime ───────────────────────────────────────────
// Loaded by Next.js automatically for the client bundle (this filename is the
// current convention; the older name was sentry.client.config.ts).
//
// DSN comes from the environment only — there is no hardcoded fallback. If
// NEXT_PUBLIC_SENTRY_DSN is unset the SDK initialises as a no-op instead of
// throwing, so local dev and preview builds work without Sentry configured.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // NOTE: `dataCollection` is deliberately NOT set.
  // Passing that object — even as `{}` — flips every unset category (user info,
  // cookies, headers, request bodies, query params) to its permissive default.
  // This app handles Clerk sessions, Stripe state, and wedding-guest PII
  // (names, emails, phone numbers submitted through the RSVP form), so it stays
  // on the conservative default (sendDefaultPii: false). Opt in per category
  // here if richer debugging context is ever worth the tradeoff.

  // Full sampling in dev, 10% in production to control event volume.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: 10% of all sessions, and 100% of sessions that hit an error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [
    // replayIntegration masks all text and blocks media by default, which is the
    // behaviour we want given the PII note above — do not relax without thought.
    Sentry.replayIntegration(),
  ],
});

// Instruments App Router client-side navigations as spans.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
