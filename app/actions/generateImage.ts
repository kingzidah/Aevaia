"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Replicate from "replicate";
import { promptSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

const GENERATION_COST = 20;
const FLUX_MODEL      = "black-forest-labs/flux-schnell" as const;

export async function generateCanvasImage(prompt: string): Promise<string> {
  // ── 1. Auth guard ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // ── 2. Validate prompt with Zod ───────────────────────────────────────────
  // Enforces non-empty and caps at 2 000 chars to avoid oversized Replicate
  // payloads and potential injection in the enhanced prompt string.
  const promptResult = promptSchema.safeParse(prompt);
  if (!promptResult.success) {
    throw new Error(promptResult.error.issues[0]?.message ?? "Invalid prompt");
  }
  const safePrompt = promptResult.data;

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }

  // ── 3. Rate limit: 10 image generations per user per minute ─────────────
  // Image generation is the most expensive action; per-user limiting prevents
  // a single account from draining Replicate budget in a burst.
  const rl = await rateLimit(`canvas-image:${userId}`, {
    limit:    10,
    windowMs: 60 * 1000,
  });
  if (!rl.success) throw new Error("You're generating images too quickly. Please wait a moment.");

  // ── 4. Find / create user row and check credit balance ───────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (prisma as any).user.upsert({
    where:  { clerkId: userId },
    create: {
      clerkId: userId,
      email:   `${userId}@placeholder.aevaia`,
      credits: 1000,
    },
    update:  {},
    select:  { id: true, credits: true },
  }) as { id: string; credits: number };

  if (user.credits < GENERATION_COST) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  // ── 5. Call Replicate — FLUX Schnell ────────────────────────────────────────
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  let output: unknown;
  try {
    output = await replicate.run(FLUX_MODEL, {
      input: { prompt: safePrompt, go_fast: true },
    });
  } catch (err) {
    console.error("[Aevaia] Replicate generation error:", err);
    throw new Error(
      "The Image Studio is currently experiencing high traffic. Please try again in a moment."
    );
  }

  // ── 6. Deduct credits only after a successful generation ────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).user.update({
    where: { id: user.id },
    data:  { credits: { decrement: GENERATION_COST } },
  });

  // ── 7. Extract and return the image URL ─────────────────────────────────────
  const url = Array.isArray(output) ? String(output[0]) : String(output);
  if (!url || url === "undefined") {
    console.error("[Aevaia] Replicate returned empty output:", output);
    throw new Error(
      "The Image Studio is currently experiencing high traffic. Please try again in a moment."
    );
  }

  return url;
}
