// ─────────────────────────────────────────────────────────────────────────────
// services/db/projectContext.ts — Data Access Layer for orchestration context.
//
// CONTRACT:
//   getProjectContext(projectId) returns a fully-typed, runtime-validated
//   ProjectContext or throws one of two typed errors:
//     • ProjectNotFoundError    — project does not exist  → caller maps to 404
//     • ProjectContextMalformedError — DB record fails schema validation → 500
//
// VALIDATION:
//   Zod parses the raw Prisma record before any field is accessed, ensuring that
//   a schema drift between the database and our TypeScript types fails loudly at
//   the boundary rather than propagating undefined values into the orchestrator.
//
// LOGGING:
//   Structured JSON via lib/logger — no console.* calls.
//   Logs contain only structural metadata (latencies, field counts).
//   Raw user content (prompts, brand data) is never logged (GDPR data minimisation).
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';
import { db } from '@/lib/db';
import { slog } from '@/lib/logger';
import type { ProjectContext } from '@/types/orchestrator';

// ── Custom error types ────────────────────────────────────────────────────────
//
// Typed errors allow API routes to map precisely to HTTP status codes without
// inspecting error message strings.  Both expose a stable `code` discriminant
// so a single `switch (err.code)` can handle the full error surface.

export class ProjectNotFoundError extends Error {
  readonly code      = 'PROJECT_NOT_FOUND' as const;
  readonly projectId: string;

  constructor(projectId: string) {
    super(`Project "${projectId}" does not exist or has been deleted`);
    this.name      = 'ProjectNotFoundError';
    this.projectId = projectId;
    if (Error.captureStackTrace) Error.captureStackTrace(this, ProjectNotFoundError);
  }
}

export class ProjectContextMalformedError extends Error {
  readonly code      = 'PROJECT_CONTEXT_MALFORMED' as const;
  readonly projectId: string;

  constructor(projectId: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`Context for project "${projectId}" failed runtime schema validation: ${detail}`);
    this.name      = 'ProjectContextMalformedError';
    this.projectId = projectId;
    this.cause     = cause;
    if (Error.captureStackTrace) Error.captureStackTrace(this, ProjectContextMalformedError);
  }
}

// ── Runtime validation schemas (Zod) ─────────────────────────────────────────
//
// RawProjectSchema mirrors the exact `select` projection sent to Prisma.
// Any field mismatch (added column, type change, nullable drift) throws
// ProjectContextMalformedError before the mapping step runs.

const RawProjectSchema = z.object({
  theme:         z.enum(['dark', 'light', 'custom']),
  brandColors:   z.array(z.string()),
  fontFamily:    z.string().min(1, 'fontFamily must be non-empty'),
  fontWeights:   z.array(z.number().int().positive()),
  narrativeTone: z.string().min(1, 'narrativeTone must be non-empty'),
  scenesJson:    z.string(),
});

type RawProject = z.infer<typeof RawProjectSchema>;

// Accepts any JSON value; returns a plain object or {} on failure.
// The `.catch({})` ensures a corrupt scenesJson never blocks the context build.
const ScenesSchema = z.record(z.string(), z.unknown()).catch({});

// ── Data access function ──────────────────────────────────────────────────────

export async function getProjectContext(projectId: string): Promise<ProjectContext> {
  const t0 = Date.now();

  // ── Query ───────────────────────────────────────────────────────────────────
  // `as any` is scoped to the call site only; the result is immediately passed
  // through RawProjectSchema before any field is accessed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: unknown = await (db as any).project.findUnique({
    where:  { id: projectId },
    select: {
      theme:         true,
      brandColors:   true,
      fontFamily:    true,
      fontWeights:   true,
      narrativeTone: true,
      scenesJson:    true,
    },
  });

  // ── Existence check ─────────────────────────────────────────────────────────
  if (raw === null || raw === undefined) {
    slog('warn', 'projectContext', 'fetch.not_found', { projectId });
    throw new ProjectNotFoundError(projectId);
  }

  // ── Runtime schema validation ───────────────────────────────────────────────
  const parsed = RawProjectSchema.safeParse(raw);
  if (!parsed.success) {
    slog('error', 'projectContext', 'fetch.malformed', {
      projectId,
      issues: parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    });
    throw new ProjectContextMalformedError(projectId, parsed.error);
  }

  const project: RawProject = parsed.data;

  slog('info', 'projectContext', 'fetch.complete', {
    projectId,
    latencyMs:   Date.now() - t0,
    colorCount:  project.brandColors.length,
    weightCount: project.fontWeights.length,
  });

  // ── Mapping ─────────────────────────────────────────────────────────────────
  const weights = project.fontWeights.length > 0 ? project.fontWeights : [400, 700];
  const scenes  = ScenesSchema.parse(tryParseJson(project.scenesJson));

  return {
    current_theme:           project.theme,           // already narrowed by z.enum
    brand_colors:            project.brandColors,
    typography_style:        { fontFamily: project.fontFamily, weights },
    existing_page_tone:      project.narrativeTone,
    current_layout_metadata: scenes,
  };
}

// ── Private helpers ───────────────────────────────────────────────────────────

function tryParseJson(raw: string): unknown {
  try   { return JSON.parse(raw); }
  catch { return {}; }
}
