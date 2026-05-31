import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getProjectContext, ProjectNotFoundError } from '@/services/db/projectContext';
import { CreditProvider } from '@/context/CreditContext';
import WorkspaceClient from '@/components/workspace/WorkspaceClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function WorkspacePage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { projectId } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = await (prisma as any).project.findUnique({
    where:  { id: projectId },
    select: { id: true, title: true, userId: true },
  }) as { id: string; title: string; userId: string } | null;

  if (!project || project.userId !== userId) notFound();

  let projectContext;
  try {
    projectContext = await getProjectContext(projectId);
  } catch (err) {
    if (err instanceof ProjectNotFoundError) notFound();
    throw err; // schema validation failures and DB errors become 500s
  }

  return (
    <CreditProvider>
      <WorkspaceClient
        projectId={projectId}
        projectTitle={project.title}
        projectContext={projectContext}
      />
    </CreditProvider>
  );
}
