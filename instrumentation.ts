// ── Next.js server instrumentation hook ───────────────────────────────────────
// Runs once per server runtime at boot and dispatches to the matching Sentry
// init. Stable since Next.js 14.0.4 (no experimental flag needed on 16.x).
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures unhandled errors thrown while rendering or handling a request,
// including Server Components and route handlers.
export const onRequestError = Sentry.captureRequestError;
