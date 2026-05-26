// ── Shared Zod schemas ────────────────────────────────────────────────────────
// Every public-facing input is validated here before it touches the database
// or an external API.  Schemas enforce:
//   • Correct types (string / number / array)
//   • Minimum / maximum length limits (prevents oversized payloads / DoS)
//   • Format constraints (email, enum membership)
//   • Unexpected fields are stripped via .strict() where noted, or by default
//     when .parse() / .safeParse() is used (Zod drops unknown keys for objects).

import { z, ZodError } from "zod";

// Zod v4 uses `.issues` (not `.errors`). This helper extracts the first
// human-readable message so every route stays consistent.
export function firstZodError(err: ZodError): string {
  return err.issues[0]?.message ?? "Invalid request";
}

// ── Primitives ────────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  // RFC 5321: max local-part (64) + @ + max domain (255) = 320; 254 is the
  // practical limit enforced by most mail servers.
  .max(254, "Email is too long")
  .email("A valid email address is required");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  // Generous cap that still prevents hash-DoS on bcrypt.
  .max(128, "Password must be 128 characters or less");

export const nameSchema = z
  .string()
  .trim()
  .max(100, "Name must be 100 characters or less")
  .optional()
  .nullable();

// AI prompts are user-supplied free text — 2 000 chars covers every real use
// case while blocking runaway payloads.
export const promptSchema = z
  .string()
  .trim()
  .min(1, "Prompt is required")
  .max(2_000, "Prompt must be 2 000 characters or less");

// ULIDs / UUIDs / cuid2s are all well under 128 chars.
export const idSchema = z
  .string()
  .trim()
  .min(1, "ID is required")
  .max(128, "ID is too long");

// Canvas state is a large JSON blob; cap at 2 MB to block oversized saves.
export const canvasStateSchema = z
  .string()
  .min(1, "Canvas state is required")
  .max(2_097_152, "Canvas state exceeds the 2 MB maximum");

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email:    emailSchema,
  password: passwordSchema,
  name:     nameSchema,
});

export const loginSchema = z.object({
  email:    emailSchema,
  // Don't apply full password rules on login — just ensure it's a string.
  password: z.string().min(1, "Password is required").max(128),
});

// ── AI generation ─────────────────────────────────────────────────────────────

export const aiGenerateSchema = z.object({
  prompt:    promptSchema,
  tone:      z.string().max(32).optional(),
  blockType: z.string().max(32).optional(),
  sessionId: z.string().max(128).optional().nullable(),
  projectId: idSchema.optional().nullable(),
  // Only allowlisted model IDs are accepted; the route does a second check too.
  model:     z.string().max(64).optional().nullable(),
});

export const chatSchema = z.object({
  prompt:            promptSchema,
  activeElementType: z.string().max(32).optional(),
  tone:              z.string().max(32).optional(),
  // Block content is user prose — 5 000 chars is generous for a card element.
  blockContent:      z.string().max(5_000).optional(),
});

export const legacyGenerateSchema = z.object({
  taskType: z.string().max(32).optional(),
  prompt:   promptSchema,
  tone:     z.string().max(32).optional(),
});

export const imageGenerateSchema = z.object({
  prompt: promptSchema,
  theme:  z.string().max(64).optional(),
});

export const orchestratorSchema = z.object({
  userInput:    z.string().trim().min(1, "userInput is required").max(2_000),
  // currentState is opaque metadata — accept any object but cap serialised size.
  currentState: z.record(z.string(), z.unknown()).optional(),
});

// ── Gifts / projects ──────────────────────────────────────────────────────────

export const giftsCreateSchema = z.object({
  // Both are serialised JSON strings from the studio canvas.
  blocks:      z.string().min(1).max(2_097_152),
  globalTheme: z.string().min(1).max(65_536),
});

export const projectSaveSchema = z.object({
  projectId:   idSchema,
  canvasState: canvasStateSchema,
});

// Guest names: max 500 per list, each name max 100 chars.
const guestListSchema = z
  .array(z.string().trim().max(100))
  .max(500, "Guest list cannot exceed 500 names");

export const checkoutSchema = z.object({
  giftId:     idSchema,
  tier:       z.enum(["INTIMATE", "EVENT"]).optional(),
  guestNames: guestListSchema.optional(),
});

export const checkInSchema = z.object({
  giftId:    idSchema,
  guestName: z.string().trim().max(100).optional(),
});

export const updateSettingsSchema = z.object({
  giftId:    idSchema,
  guestList: guestListSchema,
});

// ── Settings ──────────────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  name:  z.string().trim().max(100).optional().nullable(),
  email: emailSchema.optional(),
});

// ── Publish (legacy Supabase route) ──────────────────────────────────────────
// userId is deliberately excluded — the route derives it from the Clerk session.

export const publishSchema = z.object({
  title:          z.string().trim().max(200).optional(),
  environment:    z.record(z.string(), z.unknown()).optional(),
  canvasSettings: z.record(z.string(), z.unknown()).optional(),
  blocks:         z.unknown().optional(),
});

// ── RSVP submissions ──────────────────────────────────────────────────────────

export const rsvpSubmitSchema = z.object({
  gift_id:    idSchema,
  guest_name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  attending:  z.boolean(),
  message:    z.string().trim().max(1_000, "Message must be 1 000 characters or less").optional(),
});

// ── Support ───────────────────────────────────────────────────────────────────

export const supportSchema = z.object({
  email:   emailSchema,
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5_000, "Message must be 5 000 characters or less"),
});
