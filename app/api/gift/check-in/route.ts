import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkInSchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // ── Rate limit: 10 check-in attempts per IP per minute ───────────────────
  // Prevents automated guest-list enumeration — an attacker trying names in a
  // loop will hit the limit well before exhausting a real guest list.
  const rl = await rateLimit(`check-in:${getIp(request)}`, {
    limit:    10,
    windowMs: 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many check-in attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // ── Parse & validate with Zod ─────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { giftId: projectId, guestName } = parsed.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).$transaction(async (tx: any) => {
      const project = await tx.project.findUnique({ where: { id: projectId } });

      if (!project) {
        const err = new Error("Gift not found"); (err as NodeJS.ErrnoException).code = "NOT_FOUND"; throw err;
      }
      if (!project.isPaid) {
        const err = new Error("Gift not unlocked"); (err as NodeJS.ErrnoException).code = "NOT_PAID"; throw err;
      }

      if (project.tier === "INTIMATE") {
        if (project.deviceCount >= project.deviceCap) {
          const err = new Error("This gift has reached its viewer limit");
          (err as NodeJS.ErrnoException).code = "CAPACITY"; throw err;
        }
        await tx.project.update({
          where: { id: projectId },
          data:  { deviceCount: { increment: 1 } },
        });

      } else {
        // EVENT tier — name-based guest list validation
        if (!guestName) {
          const err = new Error("Your name is required");
          (err as NodeJS.ErrnoException).code = "NAME_REQUIRED"; throw err;
        }
        const normalised = guestName.toLowerCase();
        const onList  = (project.guestList    as string[]).some((n: string) => n.toLowerCase() === normalised);
        const claimed = (project.claimedNames as string[]).some((n: string) => n.toLowerCase() === normalised);

        if (!onList) {
          const err = new Error("You're not on the guest list for this gift");
          (err as NodeJS.ErrnoException).code = "NOT_ON_LIST"; throw err;
        }
        if (claimed) {
          const err = new Error("This ticket has already been claimed on another device");
          (err as NodeJS.ErrnoException).code = "ALREADY_CLAIMED"; throw err;
        }

        await tx.project.update({
          where: { id: projectId },
          data: {
            claimedNames: { push: guestName },
            deviceCount:  { increment: 1 },
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code    = (err as NodeJS.ErrnoException).code;
    const message = err instanceof Error ? err.message : "Check-in failed";

    const statusMap: Record<string, number> = {
      NOT_FOUND:       404,
      NOT_PAID:        402,
      CAPACITY:        403,
      NAME_REQUIRED:   400,
      NOT_ON_LIST:     403,
      ALREADY_CLAIMED: 409,
    };

    const status = code ? (statusMap[code] ?? 500) : 500;
    if (status === 500) console.error("[check-in]", err);

    return NextResponse.json({ error: message }, { status });
  }
}
