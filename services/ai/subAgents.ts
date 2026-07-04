// ─────────────────────────────────────────────────────────────────────────────
// Sub-agent execution handlers.
//
// TEXT AGENTS  (vector, copywriter, voice) — OpenRouter via openai SDK.
//   Uses process.env.OPENROUTER_API_KEY only. No ANTHROPIC_API_KEY anywhere.
//
// MEDIA AGENTS (audio, video) — Replicate SDK.
//   Uses process.env.REPLICATE_API_TOKEN.
//   Audio: meta/musicgen   → real .mp3 URL
//   Video: minimax/video-01 → real .mp4 URL
//
// Each agent function is a standalone async boundary. A failure here surfaces
// as a rejected Promise which the orchestrator's Promise.allSettled fan-out
// catches, logs, and omits — so one failed agent never breaks the rest.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from 'openai';
import Replicate from 'replicate';
import type {
  AgentKey,
  ProjectContext,
  VectorResult,
  CopywritingResult,
  AudioResult,
  VoiceResult,
  VideoResult,
  SubAgentResult,
} from '@/types/orchestrator';

// ── Model constants ───────────────────────────────────────────────────────────

const VECTOR_MODEL = 'anthropic/claude-sonnet-4-5';         // Superior SVG fidelity
const COPY_MODEL   = 'deepseek/deepseek-chat';              // Precision copywriting
const VOICE_MODEL  = 'anthropic/claude-haiku-4-5'; // Fast narration scripts

// musicgen is a community model — Replicate requires a pinned version hash for
// those (bare "owner/name" 404s). minimax models are official and run by name
// on always-warm infrastructure (no cold-boot timeouts).
const AUDIO_MODEL  = 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';    // Replicate: text → MP3
const VOICE_TTS_MODEL = 'minimax/speech-02-turbo'; // Replicate: text → MP3 narration
const VIDEO_MODEL  = 'minimax/video-01'; // Replicate: text → MP4

// 2 minutes — media generation is CPU-intensive. Note: Next.js route config
// may need `export const maxDuration = 300` for video on Vercel Edge.
const REPLICATE_TIMEOUT_MS = 120_000;

// ── Replicate client factory ──────────────────────────────────────────────────

function getReplicateClient(): Replicate {
  const auth = process.env.REPLICATE_API_TOKEN;
  if (!auth) throw new Error('[replicate] REPLICATE_API_TOKEN is not set');
  // useFileOutput: false → return URL strings instead of FileOutput objects (replicate v1)
  return new Replicate({ auth, useFileOutput: false });
}

// ── Utility helpers ───────────────────────────────────────────────────────────

function extractContent(completion: OpenAI.Chat.ChatCompletion, tag: string): string {
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error(`[${tag}] OpenRouter returned an empty content block`);
  return text;
}

/** Race a promise against a ceiling; throws a descriptive error on timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, tag: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`[${tag}] timed out after ${ms / 1000}s — Replicate did not respond`)),
        ms,
      )
    ),
  ]);
}

/**
 * Normalise Replicate output to a URL string.
 * Handles replicate v1 FileOutput objects, URL instances, plain strings, and
 * array outputs (some models return arrays of files; first element is taken).
 */
function toReplicateUrl(output: unknown, tag: string): string {
  if (typeof output === 'string') return output;
  if (output instanceof URL)      return output.href;

  if (output !== null && typeof output === 'object') {
    // Replicate v1 FileOutput has a synchronous .url() method
    if ('url' in output) {
      const urlMethod = (output as Record<string, unknown>).url;
      if (typeof urlMethod === 'function') {
        const resolved = (urlMethod as () => unknown)();
        if (resolved instanceof URL) return resolved.href;
        if (typeof resolved === 'string') return resolved;
      }
    }
    // Array output — take first file
    if (Array.isArray(output) && output.length > 0) {
      return toReplicateUrl(output[0] as unknown, tag);
    }
  }

  throw new Error(`[${tag}] Could not extract a valid URL from Replicate output: ${String(output).slice(0, 80)}`);
}

// ── 1. Vector — SVG illustration (OpenRouter, claude-sonnet-4-5) ──────────────

export async function generateVectorAsset(
  enrichedPrompt: string,
  colors: string[],
  client: OpenAI,
): Promise<VectorResult> {
  const palette = colors.length ? colors.join(', ') : '#6366f1, #ec4899';

  const completion = await client.chat.completions.create({
    model:       VECTOR_MODEL,
    max_tokens:  3000,
    temperature: 0.65,
    messages: [
      {
        role: 'system',
        content: `You are an elite SVG art engine for a heartfelt design platform.
Rules — follow every one precisely:
- Output ONLY raw SVG markup. No markdown, no explanation, no code fences.
- Root element must be exactly: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
- Use ONLY these brand hex values for fills and strokes: ${palette}
- Create a beautiful, production-ready decorative illustration under 80 elements.
- Every fill= and stroke= attribute MUST reference one of the brand hex values exactly.
- No embedded images, no <script>, no external references, no foreignObject.
- Use clean, mathematically precise path data. Optimise for visual clarity.`,
      },
      { role: 'user', content: enrichedPrompt },
    ],
  });

  const raw = extractContent(completion, 'vector');
  const svg = raw.startsWith('<svg') ? raw : extractSvgBlock(raw);
  if (!svg) throw new Error('[vector] Response did not contain a valid <svg> element');

  return { agent: 'vector', svg };
}

function extractSvgBlock(text: string): string {
  const match = text.match(/<svg[\s\S]*?<\/svg>/i);
  return match ? match[0] : '';
}

// ── 2. Copywriting — tone-matched prose (OpenRouter, deepseek-chat) ───────────

export async function generateCopywriting(
  enrichedPrompt: string,
  tone: string,
  client: OpenAI,
): Promise<CopywritingResult> {
  const completion = await client.chat.completions.create({
    model:       COPY_MODEL,
    max_tokens:  600,
    temperature: 0.78,
    messages: [
      {
        role: 'system',
        content: `You are a world-class copywriter for a heartfelt design platform.
Rules:
- Output ONLY the final copy text. No labels, headings, meta-commentary, or code fences.
- Brand tone: "${tone}". Match vocabulary, rhythm, emotional register, and sentence cadence precisely.
- Write polished, publication-ready prose. Use lists only when structure genuinely aids comprehension.
- Maximum 200 words. Every word must earn its place.`,
      },
      { role: 'user', content: enrichedPrompt },
    ],
  });

  return { agent: 'copywriter', content: extractContent(completion, 'copywriter') };
}

// ── 3. Audio — real track via Replicate meta/musicgen ────────────────────────

export async function generateAudioTrack(
  enrichedPrompt: string,
): Promise<AudioResult> {
  const replicate = getReplicateClient();

  const output = await withTimeout(
    replicate.run(AUDIO_MODEL, {
      input: {
        prompt:                 enrichedPrompt,
        model_version:          'stereo-large',
        output_format:          'mp3',
        duration:               15,
        normalization_strategy: 'peak',
      },
    }),
    REPLICATE_TIMEOUT_MS,
    'audio',
  );

  const url = toReplicateUrl(output, 'audio');
  if (!url.startsWith('http')) {
    throw new Error(`[audio] Replicate returned an invalid audio URL: ${url.slice(0, 100)}`);
  }

  const title = enrichedPrompt.replace(/\s+/g, ' ').slice(0, 64).trimEnd();

  return { agent: 'audio', url, title, durationSec: 15 };
}

// ── 4. Voice — real TTS audio via Replicate minimax/speech-02-turbo ──────────
//
// Two-step pipeline:
//   1. Claude Haiku (OpenRouter) extracts clean spoken text from the enriched prompt.
//   2. Replicate minimax/speech-02-turbo converts that text to a real MP3 audio file.
//
// We run the text-extraction step first so the TTS model receives prose narration
// rather than the orchestrator's descriptive enriched prompt, which is not suitable
// as raw TTS input. (Previously suno-ai/bark — replaced because its cold boots
// routinely exceeded the 120s timeout, making voice generation fail by default.)

export async function generateVoiceScript(
  enrichedPrompt: string,
  client: OpenAI,
): Promise<VoiceResult> {
  // ── Step 1: Extract clean spoken narration text via Claude Haiku ─────────────
  const scriptCompletion = await client.chat.completions.create({
    model:       VOICE_MODEL,
    max_tokens:  200,
    temperature: 0.55,
    messages: [
      {
        role: 'system',
        content: `You are a voiceover script editor for a heartfelt design platform.
Extract or write the exact words to be spoken aloud from the user's prompt description.
Output ONLY the spoken words — no stage directions, no brackets, no labels, no commentary.
Maximum 120 words. Every word must be naturally speakable.`,
      },
      { role: 'user', content: enrichedPrompt },
    ],
  });

  const spokenText = extractContent(scriptCompletion, 'voice-script');

  // ── Step 2: Generate real TTS audio via Replicate minimax/speech-02-turbo ────
  const replicate = getReplicateClient();

  const output = await withTimeout(
    replicate.run(VOICE_TTS_MODEL, {
      input: {
        text:     spokenText,
        voice_id: 'Friendly_Person', // Warm, clear narration preset
      },
    }),
    REPLICATE_TIMEOUT_MS,
    'voice',
  );

  const url = toReplicateUrl(output, 'voice');
  if (!url.startsWith('http')) {
    throw new Error(`[voice] Replicate returned an invalid audio URL: ${url.slice(0, 100)}`);
  }

  return { agent: 'voice', url, script: spokenText };
}

// ── 5. Video — real clip via Replicate minimax/video-01 ──────────────────────

export async function generateVideoMetadata(
  enrichedPrompt: string,
): Promise<VideoResult> {
  const replicate = getReplicateClient();

  const output = await withTimeout(
    replicate.run(VIDEO_MODEL, {
      input: {
        prompt:           enrichedPrompt,
        prompt_optimizer: true,
      },
    }),
    REPLICATE_TIMEOUT_MS,
    'video',
  );

  const url = toReplicateUrl(output, 'video');
  if (!url.startsWith('http')) {
    throw new Error(`[video] Replicate returned an invalid video URL: ${url.slice(0, 100)}`);
  }

  const description = enrichedPrompt.replace(/\s+/g, ' ').slice(0, 140).trimEnd();

  return { agent: 'video', url, description };
}

// ── Central dispatch ──────────────────────────────────────────────────────────

export async function runSubAgent(
  agent:          AgentKey,
  enrichedPrompt: string,
  context:        ProjectContext,
  client:         OpenAI,
): Promise<SubAgentResult> {
  switch (agent) {
    case 'vector':
      return generateVectorAsset(enrichedPrompt, context.brand_colors, client);
    case 'copywriter':
      return generateCopywriting(enrichedPrompt, context.existing_page_tone, client);
    case 'audio':
      return generateAudioTrack(enrichedPrompt);
    case 'voice':
      return generateVoiceScript(enrichedPrompt, client);
    case 'video':
      return generateVideoMetadata(enrichedPrompt);
  }
}
