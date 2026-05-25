import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Studio from "../page";
import { CreditProvider } from "@/context/CreditContext";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudioPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = await (prisma as any).project.findUnique({
    where:  { id },
    select: { userId: true },
  }) as { userId: string } | null;

  if (!project || project.userId !== userId) redirect("/dashboard");

  return (
    <CreditProvider>
      <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
        <Studio id={id} />
      </Suspense>
    </CreditProvider>
  );
}
