// Async Server Component — reads the Clerk session, queries both Prisma (legacy
// projects) and Supabase (new /api/publish designs) for the active user.
// Route is protected by middleware.ts — unauthenticated requests are redirected
// to /sign-in before this component ever executes.

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import DashboardClient from "@/components/dashboard/DashboardClient";
import type { ProjectRecord, DesignRecord } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const userName  = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
    : null;
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

  // ── Prisma projects (existing paid gift system) ───────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (prisma as any).project.findMany({
    where:   { userId },
    select:  { id: true, title: true, isPaid: true, tier: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take:    50,
  }) as { id: string; title: string; isPaid: boolean; tier: string; createdAt: Date; updatedAt: Date }[];

  const projects: ProjectRecord[] = rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  // ── Supabase designs (new /api/publish system) ────────────────────────────
  const { data: designRows } = await supabaseAdmin
    .from("designs")
    .select("id, title, created_at, is_published")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const designs: DesignRecord[] = (designRows ?? []).map(d => ({
    id:          d.id   as string,
    title:       (d.title as string | null) ?? "Untitled Gift",
    createdAt:   d.created_at as string,
    isPublished: (d.is_published as boolean | null) ?? false,
  }));

  return (
    <DashboardClient
      userName={userName}
      userEmail={userEmail}
      initialProjects={projects}
      initialDesigns={designs}
    />
  );
}
