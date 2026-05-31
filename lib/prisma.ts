// lib/prisma.ts — backwards-compatible re-export.
// All new server code imports `db` from '@/lib/db' directly.
// This file exists solely so that existing `import { prisma } from '@/lib/prisma'`
// call sites continue to work without a migration sweep.
export { db as prisma } from '@/lib/db';
