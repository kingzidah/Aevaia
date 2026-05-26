"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { promptSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) return null;
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey:  process.env.OPENROUTER_API_KEY,
    headers: {
      "HTTP-Referer": "https://heartcraft.app",
      "X-Title":      "Aevaia Studio",
    },
  });
}

const SYSTEM_PROMPT =
  "You are the premium asset engine for Aevaia, a luxury milestone builder. " +
  "The user will give you a theme or description (e.g. 'anniversary dinner', 'beach wedding'). " +
  "Analyze the emotional vibe and return an array of EXACTLY 5 valid string icon names from the " +
  "Lucide React library that best match the request. " +
  "Return ONLY a valid JSON array of strings, no markdown wrapping, no prose. " +
  "Example output: [\"Heart\",\"GlassWater\",\"Cake\",\"Calendar\",\"Gift\"]";

export async function getAIIcons(userPrompt: string): Promise<string[]> {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // ── Validate prompt with Zod ─────────────────────────────────────────────
  const promptResult = promptSchema.safeParse(userPrompt);
  if (!promptResult.success) {
    throw new Error(promptResult.error.issues[0]?.message ?? "Invalid prompt");
  }

  const client = getClient();
  if (!client) throw new Error("AI service not configured");

  // ── Rate limit: 20 icon suggestions per user per minute ─────────────────
  const rl = await rateLimit(`ai-icons:${userId}`, {
    limit:    20,
    windowMs: 60 * 1000,
  });
  if (!rl.success) throw new Error("Too many AI requests. Please wait a moment.");

  const { text } = await generateText({
    model:    client("google/gemini-2.5-flash"),
    system:   SYSTEM_PROMPT,
    prompt:   promptResult.data,
    maxOutputTokens: 120,
  });

  // Strip any accidental markdown fences then parse.
  const clean = text.replace(/```[a-z]*\n?/gi, "").trim();
  const parsed = JSON.parse(clean) as unknown;

  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    parsed.some((v) => typeof v !== "string")
  ) {
    throw new Error("Unexpected AI response format");
  }

  return (parsed as string[]).slice(0, 5);
}
