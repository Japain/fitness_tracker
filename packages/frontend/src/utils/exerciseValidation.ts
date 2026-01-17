import { z } from 'zod';

/**
 * Exercise Validation Constants and Schema
 *
 * NOTE: This file duplicates validation logic from @fitness-tracker/shared/validators/exercise
 * due to Vite/CommonJS compatibility issues with the shared package barrel exports.
 *
 * This serves as a single source of truth for frontend exercise validation until the
 * shared package is converted to ESM (tracked in Phase 4 technical debt).
 *
 * When using these constants, always import from this file to avoid duplication.
 */

export const EXERCISE_CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio'] as const;
export const EXERCISE_TYPES = ['strength', 'cardio'] as const;

export const createExerciseSchema = z.object({
  name: z.string()
    .min(1, { message: 'Exercise name is required' })
    .max(100, { message: 'Exercise name must be 100 characters or less' })
    .transform((val) => val.trim()),
  category: z.enum(EXERCISE_CATEGORIES, {
    errorMap: () => ({ message: 'Category must be one of: Push, Pull, Legs, Core, Cardio' }),
  }),
  type: z.enum(EXERCISE_TYPES, {
    errorMap: () => ({ message: 'Type must be either strength or cardio' }),
  }),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
