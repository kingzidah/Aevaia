import { NextResponse } from "next/server";

/**
 * Kill switch for the unfinished self-serve Studio.
 *
 * Aevaia launches as a shop window for hand-built commissions. The Studio — the
 * AI generation routes, the credit system and checkout — is not finished and
 * nothing on the marketing site links to it. But the routes were still
 * deployed, unauthenticated, and several of them spend real money on every
 * call: OpenRouter, Replicate, Stripe. A crawler or anyone who guessed a path
 * could run up a bill against an account with no per-key spending cap.
 *
 * A constant rather than an environment variable, deliberately. There is no
 * available tooling to set a variable on the deployment, so an env-var switch
 * would be unsettable in production — and a kill switch you cannot turn on is
 * not a kill switch. Flip this to false in code when the Studio actually ships.
 */
export const STUDIO_ENABLED = false;

/**
 * Returns a 503 when the Studio is off, or null to continue.
 *
 * 503 rather than 404: these routes genuinely exist and are coming back, and a
 * temporary-unavailable is the honest answer. It also tells search engines not
 * to drop them permanently.
 */
export function studioDisabledResponse(): NextResponse | null {
  if (STUDIO_ENABLED) return null;
  return NextResponse.json(
    { error: "This feature is not available yet." },
    { status: 503, headers: { "Retry-After": "86400" } },
  );
}
