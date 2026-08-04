import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildEnquirySchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/enquiry
//
// An enquiry from someone who wants a site hand-built now, rather than waiting
// for the self-serve builder. Public — these people are not users yet.
//
// These rows are leads with a deadline attached (a wedding date does not move),
// so losing one costs real work. They are stored rather than only emailed:
// email delivery can fail silently, a database row cannot.
export async function POST(request: Request) {
  const ip = getIp(request);
  const rl = await rateLimit(`enquiry:${ip}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = buildEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { name, email, phone, event_type, event_date, message } = parsed.data;

  const { error } = await supabaseAdmin.from("build_enquiries").insert([
    {
      name,
      email,
      phone:      phone || null,
      event_type: event_type || null,
      event_date: event_date || null,
      message:    message || null,
    },
  ]);

  if (error) {
    console.error("[api/enquiry] Supabase insert error:", error);
    return NextResponse.json({ error: "Could not send your enquiry" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
