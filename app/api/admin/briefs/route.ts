import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { commissionUpdateSchema, firstZodError } from "@/lib/validation";

// GET  /api/admin/briefs  — every commission, newest first
// PATCH /api/admin/briefs — set a price or move a status
//
// Owner-only. This returns other people's names, emails and phone numbers, so
// the guard is deliberately stricter than "signed in": proxy.ts already forces
// authentication on anything outside its allowlist, but any account that exists
// would clear that bar. The owner's Clerk user id has to match as well.
//
// Fails CLOSED. If no owner id is configured the route denies everyone rather
// than falling back to "any signed-in user", because the failure mode of
// guessing wrong here is publishing a client list.
async function assertOwner(): Promise<Response | null> {
  const ownerId =
    process.env.ADMIN_USER_ID ?? process.env.MAINTENANCE_BYPASS_USER_ID ?? "";

  if (!ownerId) {
    console.error("[api/admin/briefs] No ADMIN_USER_ID or MAINTENANCE_BYPASS_USER_ID set — denying");
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId || userId !== ownerId) {
    // 404 rather than 403: an unauthorised visitor learns nothing about
    // whether this endpoint exists.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export async function GET() {
  const denied = await assertOwner();
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("commissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[api/admin/briefs] Supabase read error:", error);
    return NextResponse.json({ error: "Could not load briefs" }, { status: 500 });
  }

  return NextResponse.json({ briefs: data ?? [] });
}

export async function PATCH(request: Request) {
  const denied = await assertOwner();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = commissionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { code, amount_due, status } = parsed.data;

  const patch: Record<string, unknown> = {};
  if (amount_due !== undefined) {
    patch.amount_due = amount_due;
    // Setting a price IS quoting, so the timestamp is recorded here rather than
    // relying on the status being moved by hand afterwards.
    patch.quoted_at = new Date().toISOString();
    if (status === undefined) patch.status = "quoted";
  }
  if (status !== undefined) patch.status = status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("commissions")
    .update(patch)
    .eq("code", code)
    .select()
    .single();

  if (error) {
    console.error("[api/admin/briefs] Supabase update error:", error);
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }

  return NextResponse.json({ brief: data });
}
