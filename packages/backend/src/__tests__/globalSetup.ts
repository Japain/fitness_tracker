// packages/backend/src/__tests__/globalSetup.ts
// Runs once before all test files. Verifies DB connection and creates the
// session table that connect-pg-simple would normally create on first request.
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// globalSetup runs in a separate worker before any test module is loaded,
// so env.ts hasn't been imported yet. Load .env.test manually here.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.test') });

export async function setup() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    // Verify DB is reachable
    await prisma.$queryRaw`SELECT 1`;

    // Create session table (connect-pg-simple schema)
    // This is normally created lazily by connect-pg-simple on first session write.
    // We create it here so our auth helper can INSERT sessions before any HTTP request.
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      ) WITH (OIDS=FALSE)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `;
  } finally {
    await prisma.$disconnect();
  }
}

export async function teardown() {
  // Nothing needed — test data is cleaned per-suite in setup.ts
}
