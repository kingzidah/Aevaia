import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { legacyGenerateSchema } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

// ── OpenRouter provider (shared across task types) ───────────────────────────
function getOpenRouter() {
  if (!process.env.OPENROUTER_API_KEY) return null;
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      "HTTP-Referer": "https://heartcraft.app",
      "X-Title": "Aevaia Studio",
    },
  });
}

// ── Tone → system instruction map ────────────────────────────────────────────
const TONE_SYSTEM: Record<string, string> = {
  poetic:
    "You are a romantic poet. Rewrite the provided text in poetic, lyrical prose. " +
    "Maximum 40 words. Output only the rewritten text — no commentary, no hashtags, no emojis.",
  romantic:
    "You are a heartfelt romantic copywriter. Rewrite the provided text warmly and intimately. " +
    "Maximum 40 words. Output only the rewritten text — no commentary, no hashtags, no emojis.",
  funny:
    "You are a witty, warm writer. Rewrite the provided text with light, loving humor. " +
    "Maximum 40 words. Output only the rewritten text — no commentary, no hashtags, no emojis.",
  casual:
    "You are a friendly, conversational writer. Rewrite the provided text naturally and warmly. " +
    "Maximum 40 words. Output only the rewritten text — no commentary, no hashtags, no emojis.",
};

// POST /api/generate
// Body: { taskType: 'rewrite_text' | 'orchestrate' | 'generate_theme'; prompt: string; tone?: string }
// Returns: { text: string }
export async function POST(request: Request) {
  // ── Rate limit: 20 AI requests per IP per minute ─────────────────────────
  const rl = await rateLimit(`generate:${getIp(request)}`, {
    limit:    20,
    windowMs: 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "You're generating too quickly. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // ── Parse & validate with Zod ─────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = legacyGenerateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const taskType = parsed.data.taskType ?? "rewrite_text";
  const prompt   = parsed.data.prompt;
  const tone     = parsed.data.tone ?? "romantic";

  const openRouter = getOpenRouter();
  if (!openRouter) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 503 }
    );
  }

  try {
    // ── rewrite_text: rephrase copy with selected emotional tone ────────────
    if (taskType === "rewrite_text") {
      const system = TONE_SYSTEM[tone] ?? TONE_SYSTEM.romantic;
      const { text } = await generateText({
        model: openRouter.chat("openai/gpt-4o-mini"),
        system,
        prompt,
      });
      return NextResponse.json({ text });
    }

    // ── orchestrate: general-purpose AI reasoning via Gemini ─────────────
    if (taskType === "orchestrate") {
      const { text } = await generateText({
        model: openRouter.chat("google/gemini-1.5-pro"),
        system:
          "You are Aevaia's AI orchestrator. Help craft deeply personal, " +
          "emotionally resonant gift messages. Be concise, warm, and human. " +
          "No hashtags. No emojis unless the user specifically asks.",
        prompt,
      });
      return NextResponse.json({ text });
    }

    // ── generate_theme: return structured JSON for global theme + UI navigation ─
    if (taskType === "generate_theme") {
      const { text } = await generateText({
        model: openRouter.chat("google/gemini-1.5-pro"),
        system:
          "You are Aevaia's AI orchestrator and UI navigator. " +
          "Based on the user's message, either set the visual atmosphere, navigate to a UI panel, or both.\n" +
          "Output ONLY a valid JSON object — no markdown, no code fences, no explanation.\n" +
          "Use exactly these keys (omit or set to null any key that is not applicable):\n" +
          '{\n' +
          '  "message": "<friendly one-line response to show the user (always required)>",\n' +
          '  "ui_command": null | "OPEN_GLOBAL_THEME" | "OPEN_AUDIO_PANEL" | "OPEN_ELEMENTS_TAB" | "OPEN_TEXT_TOOLS" | "OPEN_IMAGE_TOOLS",\n' +
          '  "theme": null | "minimalist" | "dark-romance" | "bright-birthday",\n' +
          '  "ambientEffect": null | "none" | "fireflies" | "floating-orbs" | "particles" | "ember"\n' +
          '}\n\n' +
          "Navigation rules:\n" +
          "- Mentions of 'WebGL', 'particles', 'ember', 'ambient', 'background effect' → ui_command: OPEN_GLOBAL_THEME\n" +
          "- Mentions of 'audio', 'music', 'song', 'sound', 'voice' → ui_command: OPEN_AUDIO_PANEL\n" +
          "- Mentions of 'add block', 'new block', 'elements', 'components' → ui_command: OPEN_ELEMENTS_TAB\n" +
          "- Mentions of 'text', 'headline', 'paragraph', 'writing' → ui_command: OPEN_TEXT_TOOLS\n" +
          "- Mentions of 'image', 'photo', 'picture', 'gallery' → ui_command: OPEN_IMAGE_TOOLS\n" +
          "- Atmospheric/mood descriptions → set theme and/or ambientEffect appropriately, no ui_command needed.",
        prompt,
      });

      try {
        const clean = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        const result = JSON.parse(clean) as {
          message?: string;
          ui_command?: string;
          theme?: string;
          ambientEffect?: string;
        };
        return NextResponse.json({
          message:       result.message       ?? null,
          ui_command:    result.ui_command    ?? null,
          theme:         result.theme         ?? null,
          ambientEffect: result.ambientEffect ?? null,
          suggestion:    result.message       ?? null,
        });
      } catch {
        return NextResponse.json({ message: text, suggestion: text });
      }
    }

    return NextResponse.json(
      { error: `Unknown taskType: ${taskType}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("[generate] OpenRouter error:", error);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
