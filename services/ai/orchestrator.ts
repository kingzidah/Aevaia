// ─────────────────────────────────────────────────────────────────────────────
// OrchestratorService — OpenRouter multi-agent routing engine.
//
// GATEWAY:   100% of LLM traffic routes through process.env.OPENROUTER_API_KEY.
//            No ANTHROPIC_API_KEY, no GEMINI_API_KEY, no SDK-level provider lock.
//
// ROUTING:   Primary model → google/gemini-2.5-flash  (strict JSON enforcement)
//            Fallback model → anthropic/claude-haiku-4-5-20251001
//            Fallback fires only on retriable failures: 429, 503, timeout.
//
// LOGGING:   Structured JSON via lib/logger — no console.* calls.
//            Logs contain only structural metadata (latencies, model, agent keys).
//            Raw user content is NEVER logged (GDPR principle of data minimisation).
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from 'openai';
import { slog } from '@/lib/logger';
import type {
  OrchestrationRequest,
  OrchestrationPayload,
  AgentKey,
  SubAgentResult,
} from '@/types/orchestrator';
import { runSubAgent } from '@/services/ai/subAgents';

// ── Routing model constants ───────────────────────────────────────────────────

const ROUTER_PRIMARY  = 'google/gemini-2.5-flash';
const ROUTER_FALLBACK = 'anthropic/claude-haiku-4-5-20251001';

// Per-attempt ceiling. Two attempts → max wall-clock exposure is 2× this value.
const ROUTE_TIMEOUT_MS = 25_000;

// ── System prompt — deterministic routing contract ────────────────────────────
//
// Design principles:
//   1. Role is stated as a constraint, not a description — model must not deviate.
//   2. JSON schema uses TypeScript-style inline type annotations to eliminate
//      structural ambiguity that would allow hallucinated field names.
//   3. Hard rules are numbered so each can be audited independently.
//   4. Failure mode (success: false) is fully specified to prevent the model
//      from inventing workaround output shapes.

const SYSTEM_PROMPT = `ROLE: You are a deterministic JSON routing agent embedded inside Aevaia Studio's orchestration boundary. You NEVER produce prose, explanations, markdown, or code fences. Your sole output is one valid JSON object.

TASK: Parse the incoming object (fields: rawPrompt, projectContext) and emit a routing decision that strictly conforms to the schema below.

─── JSON SCHEMA (every field required) ───────────────────────────────────────
{
  "success":          boolean,                    // true = routing possible; false = prompt irreparably ambiguous
  "target_agents":    AgentKey[],                 // MUST be [] when success is false
  "enriched_prompts": Record<AgentKey, string>,   // one entry per item in target_agents; MUST be {} when success is false
  "injected_styles":  Record<string, string>      // every brand/typography token you applied; {} when none
}

─── AGENT KEYS (only these exact strings) ───────────────────────────────────
  "vector"     → SVG illustration, icon sets, decorative art
  "copywriter" → Headlines, body copy, CTAs, narrative arcs
  "audio"      → Background music, soundscapes, ambient tracks
  "voice"      → Narration scripts, spoken-word, voiceovers
  "video"      → Cinematic clip descriptions, motion backgrounds

─── SELECTION RULES ─────────────────────────────────────────────────────────
1. Select ONLY agents explicitly implied by the prompt. Speculation is forbidden.
2. Each enriched_prompt must be entirely self-contained — the downstream agent receives NO other context.
3. Visual agents (vector, video): embed EVERY brand_colors hex value in the enriched prompt.
4. Text agents (copywriter, voice): embed the exact existing_page_tone string and fontFamily.
5. Record EVERY brand/typography token applied inside injected_styles.

─── HARD CONSTRAINTS ────────────────────────────────────────────────────────
1. Output EXACTLY the JSON object. Nothing before it. Nothing after it.
2. success: false → target_agents MUST equal [] and enriched_prompts MUST equal {}.
3. success: true  → target_agents MUST contain at least one valid AgentKey.
4. Do not invent agent keys outside the list above.
5. Temperature is 0.1 — maximise determinism. Do not hedge, qualify, or ask for clarification.`;

// ── Payload validation ────────────────────────────────────────────────────────

const VALID_AGENTS = new Set<AgentKey>(['vector', 'copywriter', 'audio', 'voice', 'video']);

function assertPayload(raw: unknown): OrchestrationPayload {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Routing response is not a JSON object');
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.success !== 'boolean') {
    throw new Error('assertPayload: missing or non-boolean field "success"');
  }

  if (!Array.isArray(r.target_agents)) {
    throw new Error('assertPayload: "target_agents" must be an array');
  }
  for (const a of r.target_agents as string[]) {
    if (!VALID_AGENTS.has(a as AgentKey)) {
      throw new Error(`assertPayload: unrecognised agent key "${a}"`);
    }
  }
  // Only enforce non-empty when the router claims success
  if (r.success && (r.target_agents as unknown[]).length === 0) {
    throw new Error('assertPayload: successful routing must select at least one agent');
  }

  if (typeof r.enriched_prompts !== 'object' || r.enriched_prompts === null) {
    throw new Error('assertPayload: missing field "enriched_prompts"');
  }
  if (typeof r.injected_styles !== 'object' || r.injected_styles === null) {
    throw new Error('assertPayload: missing field "injected_styles"');
  }

  return r as unknown as OrchestrationPayload;
}

// ── Error classification ──────────────────────────────────────────────────────
//
// Only retriable errors (rate limits, timeouts, provider 5xx) trigger the
// fallback model path.  Client errors (4xx) and schema violations are re-thrown
// immediately so the caller can surface a meaningful error.

function isRetriableOnFallback(err: unknown): boolean {
  if (err instanceof OpenAI.RateLimitError)              return true;   // HTTP 429
  if (err instanceof OpenAI.APIConnectionTimeoutError)   return true;   // SDK-level timeout
  if (err instanceof OpenAI.InternalServerError)         return true;   // HTTP 5xx
  return false;
}

function errorCode(err: unknown): string {
  if (err instanceof OpenAI.RateLimitError)            return 'RATE_LIMITED';
  if (err instanceof OpenAI.APIConnectionTimeoutError) return 'TIMEOUT';
  if (err instanceof OpenAI.InternalServerError)       return 'PROVIDER_5XX';
  if (err instanceof OpenAI.APIError)                  return `API_HTTP_${err.status}`;
  if (err instanceof Error)                            return err.constructor.name;
  return 'UNKNOWN';
}

// ── Service ───────────────────────────────────────────────────────────────────

export class OrchestratorService {
  private readonly openai: OpenAI;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set — all OpenRouter traffic will fail');
    }

    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey:  process.env.OPENROUTER_API_KEY,
      timeout: ROUTE_TIMEOUT_MS,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'X-Title':      'Aevaia Studio',
      },
    });
  }

  private buildUserMessage(request: OrchestrationRequest): string {
    return JSON.stringify({
      rawPrompt:      request.rawPrompt,
      projectContext: request.projectContext,
    });
  }

  // ── Single-model routing attempt ──────────────────────────────────────────
  // Isolated so it can be called with different models for primary + fallback.

  private async routeWithModel(
    model:       string,
    userMessage: string,
  ): Promise<{ payload: OrchestrationPayload; latencyMs: number }> {
    const t0 = Date.now();

    const completion = await this.openai.chat.completions.create({
      model,
      temperature:     0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
    });

    const latencyMs = Date.now() - t0;
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error(`Empty content from model "${model}"`);

    return { payload: assertPayload(JSON.parse(raw)), latencyMs };
  }

  // ── Two-tier routing (primary → fallback) ─────────────────────────────────

  private async route(request: OrchestrationRequest): Promise<OrchestrationPayload> {
    const userMessage = this.buildUserMessage(request);

    // ── Primary attempt ───────────────────────────────────────────────────
    try {
      const { payload, latencyMs } = await this.routeWithModel(ROUTER_PRIMARY, userMessage);
      slog('info', 'orchestrator', 'route.success', {
        model:    ROUTER_PRIMARY,
        latencyMs,
        agents:   payload.target_agents,
        success:  payload.success,
      });
      return payload;
    } catch (primary) {
      if (!isRetriableOnFallback(primary)) throw primary;

      slog('warn', 'orchestrator', 'route.fallback_triggered', {
        primaryModel: ROUTER_PRIMARY,
        reason:       errorCode(primary),
      });
    }

    // ── Fallback attempt ──────────────────────────────────────────────────
    // If this also fails, the error propagates to execute() and the API route.
    const { payload, latencyMs } = await this.routeWithModel(ROUTER_FALLBACK, userMessage);
    slog('info', 'orchestrator', 'route.fallback_success', {
      model:    ROUTER_FALLBACK,
      latencyMs,
      agents:   payload.target_agents,
      success:  payload.success,
    });
    return payload;
  }

  // ── Sub-agent fan-out (parallel) ──────────────────────────────────────────
  // A failing agent is omitted from results rather than crashing the response.
  // Failed agent keys are logged for observability without user content.

  private async fanOut(
    routing: OrchestrationPayload,
    request: OrchestrationRequest,
  ): Promise<Partial<Record<AgentKey, SubAgentResult>>> {
    const t0 = Date.now();

    const settlements = await Promise.allSettled(
      routing.target_agents.map(async (agent) => {
        const prompt = routing.enriched_prompts[agent];
        if (!prompt) throw new Error(`No enriched prompt for agent: ${agent}`);
        const result = await runSubAgent(agent, prompt, request.projectContext, this.openai);
        return [agent, result] as const;
      }),
    );

    const results: Partial<Record<AgentKey, SubAgentResult>> = {};
    const failures: AgentKey[] = [];

    settlements.forEach((s, i) => {
      if (s.status === 'fulfilled') {
        const [key, value] = s.value;
        results[key] = value;
      } else {
        failures.push(routing.target_agents[i]!);
      }
    });

    if (failures.length > 0) {
      slog('warn', 'orchestrator', 'fanout.partial_failure', {
        failedAgents: failures,
        successCount: routing.target_agents.length - failures.length,
      });
    }

    slog('info', 'orchestrator', 'fanout.complete', {
      latencyMs:    Date.now() - t0,
      successCount: Object.keys(results).length,
      totalAgents:  routing.target_agents.length,
    });

    return results;
  }

  // ── Public entry point ────────────────────────────────────────────────────

  async execute(request: OrchestrationRequest): Promise<OrchestrationPayload> {
    const t0 = Date.now();

    const routing = await this.route(request);

    if (!routing.success) {
      slog('info', 'orchestrator', 'execute.router_rejected', {
        totalMs: Date.now() - t0,
      });
      return routing;
    }

    const agent_results = await this.fanOut(routing, request);

    slog('info', 'orchestrator', 'execute.complete', {
      totalMs:          Date.now() - t0,
      agentResultCount: Object.keys(agent_results).length,
    });

    return { ...routing, agent_results };
  }
}

// ── Lazy singleton ────────────────────────────────────────────────────────────
// Deferred until first request so env vars are available at runtime without
// throwing during Next.js static build collection.

let _instance: OrchestratorService | null = null;
export function getOrchestratorService(): OrchestratorService {
  if (!_instance) _instance = new OrchestratorService();
  return _instance;
}
