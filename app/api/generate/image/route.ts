import { NextResponse } from "next/server";
import Replicate from "replicate";
import { imageGenerateSchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/generate/image
// Body: { prompt: string; theme?: string }
// Returns: { imageUrl: string }
export async function POST(req: Request) {
  // ── Guard: require API key before doing anything else ────────────────────
  // Replicate is expensive; fail fast if not configured rather than silently
  // constructing the client with an empty token.
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "Image generation is not configured on this server." },
      { status: 503 },
    );
  }

  // ── Rate limit: 10 image generations per IP per minute ───────────────────
  // Image generation is the most costly operation; tighter limit than text.
  const rl = await rateLimit(`generate-image:${getIp(req)}`, {
    limit:    10,
    windowMs: 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "You're generating images too quickly. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // ── Parse & validate with Zod ─────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = imageGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { prompt, theme } = parsed.data;

  const enhancedPrompt = `A beautiful, high-quality gift card illustration, ${theme ?? "elegant"} style, ${prompt}, heart-shaped bokeh, soft lighting, 8k resolution`;

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      { input: { prompt: enhancedPrompt } }
    );

    const imageUrl = (output as string[])[0];
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("[generate/image] Replicate error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
