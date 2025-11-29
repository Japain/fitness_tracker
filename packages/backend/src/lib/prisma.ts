import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';

/**
 * PrismaClient singleton instance
 *
 * This ensures we only have one Prisma Client instance throughout the application.
 * In development, this prevents connection pool exhaustion during hot reloads.
 */

// Declare a global type to store the Prisma instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a single PrismaClient instance
// In development, use the global object to preserve the instance across hot reloads
const prisma = global.prisma || new PrismaClient({
  log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
});

if (config.isDevelopment) {
  global.prisma = prisma;
}

export { prisma };
