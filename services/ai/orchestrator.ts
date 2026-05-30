// ─────────────────────────────────────────────────────────────────────────────
// OrchestratorService — Context-aware multi-agent routing engine.
//
// Tier 1 (primary):  Gemini 2.5 Flash  — native JSON schema enforcement,
//                    low-latency, structured-output guarantees.
// Tier 2 (fallback): Claude Haiku 4.5  — application-layer JSON parsing,
//                    prompt-cached system instruction.
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI, Type } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import type {
  OrchestrationRequest,
  OrchestrationPayload,
  AgentKey,
} from '@/types/orchestrator';

// ── Master system prompt (shared by both tiers) ───────────────────────────────
// Kept as a module-level constant so it can be prompt-cached by Claude and
// referenced without instantiation cost on Gemini.
const SYSTEM_PROMPT = `You are a principal prompt engineer and creative traffic manager for an AI-powered design platform.

Your role is to analyse the user's raw intent alongside the provided ProjectContext and produce a precise, deterministic routing decision.

## Core Responsibilities
1. Decompose the raw prompt into agent-specific sub-tasks. Select ONLY the agents genuinely needed.
2. Expand each sub-prompt to be self-sufficient: the receiving agent must not require any other context to act.
3. Enforce brand fidelity: every visual instruction MUST reference the exact brand_colors hex tokens. Every text instruction MUST match the existing_page_tone.
4. Inject typography constraints into copywriter and voice prompts using the typography_style values.
5. Populate injected_styles with the token → value pairs you applied so the client can audit usage.

## Available Agents
- "vector"     — SVG illustration, icon sets, decorative art
- "copywriter" — Headlines, paragraphs, CTAs, story arcs
- "audio"      — Background music, soundscapes, ambient tracks
- "voice"      — Narration, spoken-word, voiceover scripts
- "video"      — Cinematic clips, motion backgrounds, animations

## Output Rules
- Respond ONLY with valid JSON matching the OrchestrationPayload schema.
- Set success: true when routing succeeds, false if the prompt is too ambiguous to route.
- target_agents must contain only agent keys from the list above.
- enriched_prompts must have exactly one key per agent in target_agents.
- injected_styles must list every brand/typography token you applied.
- Temperature is already set to 0.1 — do not hedge or add caveats. Be decisive.`;

// ── Gemini response schema (native enforcement) ────────────────────────────────
const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    success: { type: Type.BOOLEAN },
    target_agents: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        enum: ['vector', 'copywriter', 'audio', 'voice', 'video'],
      },
    },
    enriched_prompts: {
      type: Type.OBJECT,
      additionalProperties: { type: Type.STRING },
    },
    injected_styles: {
      type: Type.OBJECT,
      additionalProperties: { type: Type.STRING },
    },
  },
  required: ['success', 'target_agents', 'enriched_prompts', 'injected_styles'],
};

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_AGENTS = new Set<AgentKey>(['vector', 'copywriter', 'audio', 'voice', 'video']);

function assertPayload(raw: unknown): OrchestrationPayload {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Routing response is not an object');
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.success !== 'boolean') throw new Error('Missing field: success');

  if (!Array.isArray(r.target_agents) || r.target_agents.length === 0) {
    throw new Error('target_agents must be a non-empty array');
  }
  for (const a of r.target_agents as string[]) {
    if (!VALID_AGENTS.has(a as AgentKey)) throw new Error(`Unknown agent: ${a}`);
  }

  if (typeof r.enriched_prompts !== 'object' || r.enriched_prompts === null) {
    throw new Error('Missing field: enriched_prompts');
  }
  if (typeof r.injected_styles !== 'object' || r.injected_styles === null) {
    throw new Error('Missing field: injected_styles');
  }

  return r as unknown as OrchestrationPayload;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class OrchestratorService {
  private readonly gemini: GoogleGenAI;
  private readonly anthropic: Anthropic;

  constructor() {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

    this.gemini   = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  /** Build the user-turn message from the request. */
  private buildUserMessage(request: OrchestrationRequest): string {
    return JSON.stringify({
      rawPrompt:      request.rawPrompt,
      projectContext: request.projectContext,
    });
  }

  // ── Tier 1: Gemini 2.5 Flash ────────────────────────────────────────────────

  private async runGemini(request: OrchestrationRequest): Promise<OrchestrationPayload> {
    const response = await this.gemini.models.generateContent({
      model:    'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: this.buildUserMessage(request) }] },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType:  'application/json',
        responseSchema:    GEMINI_RESPONSE_SCHEMA,
        temperature:       0.1,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Gemini returned an empty response');

    return assertPayload(JSON.parse(text));
  }

  // ── Tier 2: Claude Haiku 4.5 (prompt-cached fallback) ──────────────────────

  private async runClaude(request: OrchestrationRequest): Promise<OrchestrationPayload> {
    const message = await this.anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // Cache the system prompt — it is identical on every call and exceeds
          // the 1 024-token minimum for prompt caching to apply.
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        { role: 'user', content: this.buildUserMessage(request) },
      ],
      temperature: 0.1,
    });

    const block = message.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') {
      throw new Error('Claude returned no text content');
    }

    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return assertPayload(JSON.parse(cleaned));
  }

  // ── Public entry point ──────────────────────────────────────────────────────

  async execute(request: OrchestrationRequest): Promise<OrchestrationPayload> {
    let geminiError: unknown;

    try {
      return await this.runGemini(request);
    } catch (err) {
      geminiError = err;
      console.warn('[orchestrator] Gemini tier failed, switching to Claude fallback:', err);
    }

    try {
      return await this.runClaude(request);
    } catch (claudeErr) {
      console.error('[orchestrator] Claude fallback also failed:', claudeErr);
      throw new AggregateError(
        [geminiError, claudeErr],
        'Both routing tiers failed. See individual errors for details.',
      );
    }
  }
}

// Lazy singleton — deferred until first request so env vars are available
// at runtime without throwing during Next.js static build collection.
let _instance: OrchestratorService | null = null;
export function getOrchestratorService(): OrchestratorService {
  if (!_instance) _instance = new OrchestratorService();
  return _instance;
}
