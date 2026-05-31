// ─────────────────────────────────────────────────────────────────────────────
// lib/db.ts — Canonical Prisma client singleton for all server code.
//
// WHY A GLOBAL SINGLETON?
//   Next.js hot-reloads in development re-evaluate every module, creating a new
//   PrismaClient on each reload.  Without a global anchor the connection pool
//   exhausts within seconds (default limit: 10 connections).  Anchoring to
//   `globalThis` survives module re-evaluation while still being GC-ed when
//   the process exits.
//
// WHY __heartcraftPrisma NOT "prisma"?
//   A namespaced key prevents silent collisions with other libraries or test
//   frameworks that might attach their own "prisma" property to globalThis.
//
// lib/prisma.ts is preserved as a backwards-compatible re-export so that
// the rest of the codebase requires no import-path changes.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { slog } from '@/lib/logger';

// ── Global augmentation ───────────────────────────────────────────────────────
// `declare global` augments NodeJS.Global / typeof globalThis so TypeScript
// accepts property access on globalThis without an `as unknown` cast.

declare global {
  // eslint-disable-next-line no-var
  var __heartcraftPrisma: PrismaClient | undefined;
}

// ── Client factory ────────────────────────────────────────────────────────────

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('[db] DATABASE_URL is not set — Prisma client cannot initialise');
  }

  const adapter = new PrismaPg({ connectionString });

  // The driver-adapter overload does not yet fully satisfy PrismaClientOptions
  // in all generated-client versions — the `as any` is intentional and isolated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = new PrismaClient({ adapter } as any);

  slog('info', 'db', 'client.created', {
    env: process.env.NODE_ENV ?? 'unknown',
  });

  return client;
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const db: PrismaClient =
  globalThis.__heartcraftPrisma ?? createClient();

// Persist across hot-reloads in development.
// In production every serverless invocation starts a fresh process — no-op.
if (process.env.NODE_ENV !== 'production') {
  globalThis.__heartcraftPrisma = db;
}
