import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { publishSchema, firstZodError } from "@/lib/validation";

// POST /api/publish
// Inserts the full canvas snapshot into the `designs` table (JSONB columns).
// Uses the service-role client so it bypasses RLS for this server-side write.
// user_id is ALWAYS derived from the authenticated Clerk session — never from
// the request payload — to prevent identity spoofing.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { title, environment, canvasSettings, blocks } = parsed.data;

  const mergedEnvironment = {
    ...(environment    ?? {}),
    ...(canvasSettings ?? {}),
  };

  const { data, error } = await supabaseAdmin
    .from("designs")
    .insert([{
      title:        title || "Untitled Gift",
      user_id:      userId,
      is_published: true,
      environment:  mergedEnvironment,
      blocks,
    }])
    .select()
    .single();

  if (error) {
    console.error("[api/publish] Supabase insert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, url: `https://zidah.com/gift/${data.id}` },
    { status: 200 },
  );
}
