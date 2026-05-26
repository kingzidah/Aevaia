import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/system-user";
import { prisma } from "@/lib/prisma";
import { TEMPLATES } from "@/lib/templates";

// POST /api/projects/from-template
// Duplicates a starter-pack blueprint into a new Project owned by the
// authenticated user, then returns the new project id for the studio redirect.
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body       = await request.json() as { templateId?: string };
  const template   = TEMPLATES.find(t => t.id === body.templateId);

  if (!template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma as any).project.create({
      data: {
        userId,
        title:     template.title,
        scenesJson: template.scenesJson,
      },
      select: { id: true },
    }) as { id: string };

    return NextResponse.json({ id: project.id });
  } catch (err) {
    console.error("[projects/from-template]", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
