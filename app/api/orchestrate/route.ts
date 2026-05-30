import { NextRequest, NextResponse } from 'next/server';
import { getOrchestratorService } from '@/services/ai/orchestrator';
import type { OrchestrationRequest, ProjectContext } from '@/types/orchestrator';

export const runtime = 'nodejs';

// ── Input guard ───────────────────────────────────────────────────────────────

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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { rawPrompt, projectContext } = (body ?? {}) as Partial<OrchestrationRequest>;

  if (typeof rawPrompt !== 'string' || !rawPrompt.trim()) {
    return NextResponse.json({ success: false, error: 'rawPrompt is required' }, { status: 400 });
  }
  if (!isValidContext(projectContext)) {
    return NextResponse.json(
      { success: false, error: 'projectContext is missing or malformed' },
      { status: 400 },
    );
  }

  try {
    const payload = await getOrchestratorService().execute({ rawPrompt, projectContext });
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown orchestration error';
    console.error('[/api/orchestrate] Both tiers failed:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
