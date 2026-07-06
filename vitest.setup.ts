// Global test setup. Provides a dummy DATABASE_URL so that any route module
// which transitively imports lib/db.ts (it constructs a Prisma client at module
// load and throws when DATABASE_URL is absent) can be imported without a real
// database. No connection is opened — the client only connects when a query
// runs, and tests mock '@/lib/prisma' so no query ever does.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
