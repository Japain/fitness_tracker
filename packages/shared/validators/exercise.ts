/**
 * Zod validation schemas for exercise-related data
 * These schemas are shared between frontend and backend to ensure consistent validation
 */

import { z } from 'zod';

// ============================================================================
// Exercise Validation Schemas
// ============================================================================

/**
 * Valid exercise categories
 */
export const EXERCISE_CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio'] as const;

/**
 * Valid exercise types
 */
export const EXERCISE_TYPES = ['strength', 'cardio'] as const;

/**
 * Schema for exercise list query parameters
 * All fields are optional for flexible filtering
 */
export const exerciseListQuerySchema = z.object({
  category: z.enum(EXERCISE_CATEGORIES).optional(),
  type: z.enum(EXERCISE_TYPES).optional(),
  search: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(1).max(100).optional()
  ),
});

/**
 * Schema for creating a custom exercise
 * All fields are required
 */
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

/**
 * Schema for updating a custom exercise
 * All fields are optional, but at least one must be provided
 */
export const updateExerciseSchema = z.object({
  name: z.string()
    .min(1, { message: 'Exercise name cannot be empty' })
    .max(100, { message: 'Exercise name must be 100 characters or less' })
    .transform((val) => val.trim())
    .optional(),
  category: z.enum(EXERCISE_CATEGORIES, {
    errorMap: () => ({ message: 'Category must be one of: Push, Pull, Legs, Core, Cardio' }),
  }).optional(),
  type: z.enum(EXERCISE_TYPES, {
    errorMap: () => ({ message: 'Type must be either strength or cardio' }),
  }).optional(),
}).refine(
  (data) => data.name !== undefined || data.category !== undefined || data.type !== undefined,
  {
    message: 'At least one field (name, category, or type) must be provided for update',
  }
);

// ============================================================================
// Type Exports
// ============================================================================

export type ExerciseListQuery = z.infer<typeof exerciseListQuerySchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseCategory = typeof EXERCISE_CATEGORIES[number];
export type ExerciseType = typeof EXERCISE_TYPES[number];
