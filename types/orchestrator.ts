// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator — Shared type contracts for the multi-agent routing engine.
// All three layers (API, service, client) import from here.
// ─────────────────────────────────────────────────────────────────────────────

export type AgentKey = 'vector' | 'copywriter' | 'audio' | 'voice' | 'video';

export interface TypographyStyle {
  fontFamily: string;
  weights:    number[];
}

/** Snapshot of the active canvas state injected into every routing request. */
export interface ProjectContext {
  current_theme:           'dark' | 'light' | 'custom';
  brand_colors:            string[];               // e.g. ["#be185d","#a855f7"]
  typography_style:        TypographyStyle;
  existing_page_tone:      string;                 // e.g. "romantic and cinematic"
  current_layout_metadata: Record<string, unknown>;
}

/** Raw request body sent to the orchestration engine. */
export interface OrchestrationRequest {
  rawPrompt:      string;
  projectContext: ProjectContext;
}

/** Verified payload produced by the routing LLM and returned to the client. */
export interface OrchestrationPayload {
  success:          boolean;
  target_agents:    AgentKey[];
  enriched_prompts: Record<string, string>;  // agent key → expanded prompt
  injected_styles:  Record<string, string>;  // token name → applied value
}

/** Internal structured error returned when both routing tiers fail. */
export interface OrchestrationError {
  success: false;
  error:   string;
  tier:    'gemini' | 'claude' | 'both';
}
