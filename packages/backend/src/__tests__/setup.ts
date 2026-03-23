// packages/backend/src/__tests__/setup.ts
// Runs before each test FILE (not each test). Truncates user-created data so
// test suites start from a clean slate (exercise library rows are preserved).
import { afterAll, beforeAll } from 'vitest';
import { prisma } from '../lib/prisma';

beforeAll(async () => {
  // Delete all user-created data. WorkoutSets and WorkoutExercises cascade-delete
  // when WorkoutSession is deleted due to Prisma cascade rules.
  await prisma.workoutSession.deleteMany();
  // Delete custom exercises only (library exercises have isCustom=false)
  await prisma.exercise.deleteMany({ where: { isCustom: true } });
  // Delete test users (and cascade any remaining data)
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@test.invalid' } },
  });
  // Clear sessions
  await prisma.$executeRaw`DELETE FROM session WHERE TRUE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
