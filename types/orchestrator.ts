// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator — Shared type contracts for the multi-agent routing engine.
// All three layers (API route, service, client) import from here.
// ─────────────────────────────────────────────────────────────────────────────

export type AgentKey = 'vector' | 'copywriter' | 'audio' | 'voice' | 'video';

export interface TypographyStyle {
  fontFamily: string;
  weights:    number[];
}

/** Snapshot of the active canvas state injected into every routing request. */
export interface ProjectContext {
  current_theme:           'dark' | 'light' | 'custom';
  brand_colors:            string[];
  typography_style:        TypographyStyle;
  existing_page_tone:      string;
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
  enriched_prompts: Record<string, string>;
  injected_styles:  Record<string, string>;
  agent_results?:   Partial<Record<AgentKey, SubAgentResult>>;
}

/** Structured error returned when the routing tier fails. */
export interface OrchestrationError {
  success: false;
  error:   string;
}

// ── Sub-agent result types ────────────────────────────────────────────────────

export interface VectorResult {
  agent: 'vector';
  svg:   string;
}

export interface CopywritingResult {
  agent:   'copywriter';
  content: string;
}

export interface AudioResult {
  agent:       'audio';
  url:         string;  // Real .mp3 URL from Replicate musicgen
  title:       string;
  durationSec: number;
}

export interface VoiceResult {
  agent:  'voice';
  url:    string;  // Real audio URL from Replicate Bark
  script: string;  // The spoken text (for display and copy)
}

export interface VideoResult {
  agent:       'video';
  url:         string;  // Real .mp4 URL from Replicate
  description: string;
}

export type SubAgentResult =
  | VectorResult
  | CopywritingResult
  | AudioResult
  | VoiceResult
  | VideoResult;
