// ── Sentry — Edge runtime ─────────────────────────────────────────────────────
// Loaded from instrumentation.ts when NEXT_RUNTIME === "edge". This covers
// proxy.ts (the Next.js 16 middleware convention) and any edge route handlers.
// See instrumentation-client.ts for why `dataCollection` is intentionally unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,
});
