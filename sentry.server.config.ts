// ── Sentry — Node.js server runtime ───────────────────────────────────────────
// Loaded from instrumentation.ts when NEXT_RUNTIME === "nodejs".
// See instrumentation-client.ts for why `dataCollection` is intentionally unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Attaches local variable values to stack frames, which makes server-side
  // exceptions far easier to diagnose without a reproduction.
  includeLocalVariables: true,

  enableLogs: true,
});
