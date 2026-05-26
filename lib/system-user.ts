import { auth } from "@clerk/nextjs/server";

// ── Clerk-based user ID resolution ───────────────────────────────────────────
//
// Returns the authenticated Clerk user ID (`userId`) when a valid session
// exists. Returns null when no session is present — the caller should issue
// a 401 in that case.
//
// This replaces the previous custom JWT / session-cookie system.

export async function getAuthenticatedUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

// Alias kept for callers that passed an allowFallback boolean. The fallback
// system-user concept is removed with Clerk — the param is accepted but ignored;
// unauthenticated callers always receive null.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function resolveUserId(_allowFallback = false): Promise<string | null> {
  return getAuthenticatedUserId();
}
