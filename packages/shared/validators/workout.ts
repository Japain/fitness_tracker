/**
 * Zod validation schemas for workout-related data
 * These schemas are shared between frontend and backend to ensure consistent validation
 */

import { z } from 'zod';

// ============================================================================
// WorkoutSession Validation Schemas
// ============================================================================

/**
 * Schema for creating a new workout session
 * startTime is optional (defaults to now on backend)
 */
export const createWorkoutSessionSchema = z.object({
  startTime: z.string().datetime().optional(),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Schema for updating an existing workout session
 * All fields are optional, but at least one must be provided
 */
export const updateWorkoutSessionSchema = z.object({
  endTime: z.string().datetime().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
}).refine(
  (data) => data.endTime !== undefined || data.notes !== undefined,
  {
    message: 'At least one field (endTime or notes) must be provided for update',
  }
);

/**
 * Schema for workout list query parameters
 */
export const workoutListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(['active', 'completed', 'all']).default('all'),
});

// ============================================================================
// WorkoutExercise Validation Schemas
// ============================================================================

/**
 * Schema for adding an exercise to a workout
 */
export const createWorkoutExerciseSchema = z.object({
  exerciseId: z.string().uuid({ message: 'exerciseId must be a valid UUID' }),
  orderIndex: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Schema for updating a workout exercise
 * All fields are optional, but at least one must be provided
 */
export const updateWorkoutExerciseSchema = z.object({
  orderIndex: z.number().int().min(0).optional(),
  notes: z.string().max(500).nullable().optional(),
}).refine(
  (data) => data.orderIndex !== undefined || data.notes !== undefined,
  {
    message: 'At least one field (orderIndex or notes) must be provided for update',
  }
);

// ============================================================================
// WorkoutSet Validation Schemas
// ============================================================================

/**
 * Schema for creating a new workout set
 * Note: This schema accepts both strength and cardio fields.
 * The backend performs additional runtime validation to ensure the provided fields
 * match the exercise type (strength exercises require reps, cardio requires duration).
 * This approach maintains flexibility while ensuring type safety through Zod validation
 * combined with backend business logic validation.
 */
export const createWorkoutSetSchema = z.object({
  setNumber: z.number().int().positive().optional(),
  completed: z.boolean().default(false),
  // Strength fields
  reps: z.number().int().positive().optional(),
  weight: z.number().nonnegative().optional().nullable(),
  weightUnit: z.enum(['lbs', 'kg', 'bodyweight']).optional().nullable(),
  // Cardio fields
  duration: z.number().int().positive().optional(),
  distance: z.number().nonnegative().optional().nullable(),
  distanceUnit: z.enum(['miles', 'km']).optional().nullable(),
}).refine(
  (data) => {
    // Must have either strength fields or cardio fields
    const hasStrengthFields = data.reps !== undefined;
    const hasCardioFields = data.duration !== undefined;
    return hasStrengthFields || hasCardioFields;
  },
  {
    message: 'Set must include either strength fields (reps) or cardio fields (duration)',
  }
);

/**
 * Schema for updating an existing workout set
 * All fields are optional, but at least one must be provided
 */
export const updateWorkoutSetSchema = z.object({
  setNumber: z.number().int().positive().optional(),
  completed: z.boolean().optional(),
  // Strength fields
  reps: z.number().int().positive().optional(),
  weight: z.number().nonnegative().nullable().optional(),
  weightUnit: z.enum(['lbs', 'kg', 'bodyweight']).nullable().optional(),
  // Cardio fields
  duration: z.number().int().positive().optional(),
  distance: z.number().nonnegative().nullable().optional(),
  distanceUnit: z.enum(['miles', 'km']).nullable().optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    return Object.values(data).some(v => v !== undefined);
  },
  {
    message: 'At least one field must be provided for update',
  }
);

// ============================================================================
// Type Exports
// ============================================================================

export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>;
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>;
export type WorkoutListQuery = z.infer<typeof workoutListQuerySchema>;

export type CreateWorkoutExerciseInput = z.infer<typeof createWorkoutExerciseSchema>;
export type UpdateWorkoutExerciseInput = z.infer<typeof updateWorkoutExerciseSchema>;

export type CreateWorkoutSetInput = z.infer<typeof createWorkoutSetSchema>;
export type UpdateWorkoutSetInput = z.infer<typeof updateWorkoutSetSchema>;
