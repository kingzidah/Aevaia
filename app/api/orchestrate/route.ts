// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orchestrate — Entry-point for the multi-agent orchestration engine.
//
// SECURITY:
//   • Cache-Control: no-store, private  → prevents proxies/CDNs caching user data
//   • Raw user content is never logged  → GDPR principle of data minimisation
//   • Internal error details are not forwarded to the client
//
// OBSERVABILITY:
//   • Every request carries a UUID correlation ID (X-Request-Id response header)
//   • Total request latency is logged as a structured field (totalMs)
//   • Error codes are structural names, never raw error messages
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrchestratorService } from '@/services/ai/orchestrator';
import { rateLimit } from '@/lib/rate-limit';
import { slog } from '@/lib/logger';
import type { OrchestrationRequest, ProjectContext } from '@/types/orchestrator';

export const runtime    = 'nodejs';
export const maxDuration = 300;

// ── GDPR-aligned response headers ────────────────────────────────────────────
// Applied to every response (success AND error) to ensure no orchestration
// payload is cached by any intermediate layer.

const PRIVATE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma':        'no-cache',
};

// ── Input guard ───────────────────────────────────────────────────────────────

// Generous ceiling for a creative brief; blocks cost-abuse via megabyte prompts.
const MAX_PROMPT_CHARS = 4_000;

function isValidContext(c: unknown): c is ProjectContext {
  if (typeof c !== 'object' || c === null) return false;
  const ctx = c as Record<string, unknown>;
  return (
    ['dark', 'light', 'custom'].includes(ctx.current_theme as string) &&
    Array.isArray(ctx.brand_colors) &&
    typeof ctx.typography_style === 'object' && ctx.typography_style !== null &&
    typeof ctx.existing_page_tone === 'string' &&
    typeof ctx.current_layout_metadata === 'object' && ctx.current_layout_metadata !== null
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Unique ID for log correlation — surfaced in X-Request-Id so clients can
  // include it in bug reports without us exposing internal stack data.
  const requestId = crypto.randomUUID();
  const t0        = Date.now();

  const responseHeaders = {
    ...PRIVATE_HEADERS,
    'X-Request-Id': requestId,
  };

  // ── Auth: reject unauthenticated callers before any provider call ─────────
  // Defence in depth — the proxy gates this in production, but a handler-level
  // check closes the dev gap and survives any public-route allowlist drift.
  // This is the most expensive route in the app (multi-LLM + Replicate fan-out).
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401, headers: responseHeaders },
    );
  }

  // ── Rate limit: 10 orchestrations per user per minute ─────────────────────
  // Each request can fan out to several paid models, so the ceiling is tighter
  // than single-model routes. failClosed: a Redis outage must not open an
  // unmetered path onto OpenRouter/Replicate spend.
  const rl = await rateLimit(`orchestrate:${userId}`, {
    limit:      10,
    windowMs:   60 * 1000,
    failClosed: true,
  });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "You're generating too quickly. Please wait a moment and try again." },
      { status: 429, headers: { ...responseHeaders, 'Retry-After': String(rl.retryAfter) } },
    );
  }

  // ── Body parsing ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request body must be valid JSON' },
      { status: 400, headers: responseHeaders },
    );
  }

  const { rawPrompt, projectContext } = (body ?? {}) as Partial<OrchestrationRequest>;

  if (typeof rawPrompt !== 'string' || !rawPrompt.trim()) {
    return NextResponse.json(
      { success: false, error: 'rawPrompt is required and must be a non-empty string' },
      { status: 400, headers: responseHeaders },
    );
  }

  if (rawPrompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json(
      { success: false, error: `rawPrompt must be at most ${MAX_PROMPT_CHARS} characters` },
      { status: 400, headers: responseHeaders },
    );
  }

  if (!isValidContext(projectContext)) {
    return NextResponse.json(
      { success: false, error: 'projectContext is missing required fields or contains invalid values' },
      { status: 400, headers: responseHeaders },
    );
  }

  // ── Orchestration ─────────────────────────────────────────────────────────
  try {
    const payload  = await getOrchestratorService().execute({ rawPrompt, projectContext });
    const totalMs  = Date.now() - t0;

    slog('info', 'api/orchestrate', 'request.complete', {
      requestId,
      totalMs,
      success:      payload.success,
      agentCount:   payload.agent_results ? Object.keys(payload.agent_results).length : 0,
      routedAgents: payload.target_agents,
    });

    return NextResponse.json(payload, { headers: responseHeaders });

  } catch (err) {
    const totalMs = Date.now() - t0;
    const errCode = err instanceof Error ? err.constructor.name : 'UnknownError';

    slog('error', 'api/orchestrate', 'request.failed', {
      requestId,
      totalMs,
      errCode,
    });

    // Return a safe, opaque message — never forward internal error details.
    return NextResponse.json(
      {
        success: false,
        error:   'Orchestration service is temporarily unavailable. Please retry.',
        requestId,
      },
      { status: 500, headers: responseHeaders },
    );
  }
}
