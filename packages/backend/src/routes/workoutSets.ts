import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { verifyCsrfToken } from '../middleware/csrf';
import { validateBody } from '../middleware/validateRequest';
import { prisma } from '../lib/prisma';
import { logError } from '../utils/errorLogger';
import { verifyWorkoutExerciseOwnership } from '../utils/workoutHelpers';
import type { User } from '@fitness-tracker/shared';
import {
  createWorkoutSetSchema,
  updateWorkoutSetSchema,
  type CreateWorkoutSetInput,
  type UpdateWorkoutSetInput,
} from '@fitness-tracker/shared/validators';
import type { Prisma } from '@prisma/client';

const router = Router();

/**
 * All workout set routes require authentication
 */
router.use(requireAuth);

/**
 * POST /api/workouts/:workoutId/exercises/:exerciseId/sets
 * Add a set to a workout exercise
 *
 * Request body:
 * For strength exercises:
 * - reps: Number of repetitions (required)
 * - weight: Weight value (optional for bodyweight)
 * - weightUnit: 'lbs' | 'kg' | 'bodyweight'
 *
 * For cardio exercises:
 * - duration: Duration in seconds (required)
 * - distance: Distance value (optional)
 * - distanceUnit: 'miles' | 'km'
 *
 * Common fields:
 * - setNumber: Set number (optional, auto-increments if not provided)
 * - completed: Boolean (default: false)
 *
 * Security: Validates workout belongs to authenticated user
 * Validation: Ensures strength/cardio fields match exercise type
 * Returns: 404 if workout/exercise not found, 400 for validation errors, 201 with created set
 */
router.post('/:workoutId/exercises/:exerciseId/sets', verifyCsrfToken, validateBody(createWorkoutSetSchema), async (req, res) => {
  try {
    const { workoutId, exerciseId } = req.params;
    const validatedData = req.validatedBody as CreateWorkoutSetInput;
    const userId = (req.user as User).id;

    // Verify workout exercise exists and user owns the workout
    const workoutExercise = await verifyWorkoutExerciseOwnership(workoutId, exerciseId, userId, res);
    if (!workoutExercise) return; // Response already sent by helper

    // Validate fields based on exercise type
    const exerciseType = workoutExercise.exercise.type;

    if (exerciseType === 'strength') {
      // Strength exercises require reps
      if (validatedData.reps === undefined || validatedData.reps === null) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Reps are required for strength exercises',
        });
      }
    } else if (exerciseType === 'cardio') {
      // Cardio exercises require duration
      if (validatedData.duration === undefined || validatedData.duration === null) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Duration is required for cardio exercises',
        });
      }
    }

    // Determine setNumber if not provided
    let finalSetNumber = validatedData.setNumber;
    if (finalSetNumber === undefined || finalSetNumber === null) {
      // Get the current max setNumber for this exercise
      const maxSet = await prisma.workoutSet.findFirst({
        where: { workoutExerciseId: exerciseId },
        orderBy: { setNumber: 'desc' },
      });
      finalSetNumber = maxSet ? maxSet.setNumber + 1 : 1;
    } else {
      // If setNumber is provided, check for conflicts
      const existingSet = await prisma.workoutSet.findFirst({
        where: {
          workoutExerciseId: exerciseId,
          setNumber: finalSetNumber,
        },
      });
      if (existingSet) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Set number ${finalSetNumber} already exists for this exercise`,
        });
      }
    }

    // Build set data based on exercise type with proper Prisma types
    const setData: Prisma.WorkoutSetCreateInput = {
      workoutExercise: {
        connect: { id: exerciseId }
      },
      setNumber: finalSetNumber,
      completed: validatedData.completed ?? false,
    };

    if (exerciseType === 'strength') {
      setData.reps = validatedData.reps!;
      setData.weight = validatedData.weight ?? null;
      setData.weightUnit = validatedData.weightUnit ?? null;
    } else if (exerciseType === 'cardio') {
      setData.duration = validatedData.duration!;
      setData.distance = validatedData.distance ?? null;
      setData.distanceUnit = validatedData.distanceUnit ?? null;
    }

    // Create set
    const set = await prisma.workoutSet.create({
      data: setData,
    });

    res.status(201).json(set);
  } catch (error) {
    logError('Failed to add set to workout exercise', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.workoutId,
      exerciseId: req.params.exerciseId,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add set to workout exercise',
    });
  }
});

/**
 * PATCH /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
 * Update a workout set
 *
 * Request body: Any fields from the set (reps, weight, duration, distance, completed, etc.)
 *
 * Security: Validates workout belongs to authenticated user
 * Validation: Ensures updated fields are valid for exercise type, at least one field required
 * Returns: 404 if workout/exercise/set not found, 400 for validation errors, 200 with updated set
 */
router.patch('/:workoutId/exercises/:exerciseId/sets/:setId', verifyCsrfToken, validateBody(updateWorkoutSetSchema), async (req, res) => {
  try {
    const { workoutId, exerciseId, setId } = req.params;
    const validatedData = req.validatedBody as UpdateWorkoutSetInput;
    const userId = (req.user as User).id;

    // Verify workout exercise exists and user owns the workout
    const workoutExercise = await verifyWorkoutExerciseOwnership(workoutId, exerciseId, userId, res);
    if (!workoutExercise) return; // Response already sent by helper

    // Verify set exists
    const existingSet = await prisma.workoutSet.findFirst({
      where: {
        id: setId,
        workoutExerciseId: exerciseId,
      },
    });

    if (!existingSet) {
      return res.status(404).json({
        error: 'Set not found',
        message: 'The requested set does not exist',
      });
    }

    // Validate fields based on exercise type
    const exerciseType = workoutExercise.exercise.type;
    const updateData: Prisma.WorkoutSetUpdateInput = {};

    if (exerciseType === 'strength') {
      // Validate strength fields if being updated
      if (validatedData.reps !== undefined) {
        updateData.reps = validatedData.reps;
      }
      if (validatedData.weight !== undefined) {
        updateData.weight = validatedData.weight;
      }
      if (validatedData.weightUnit !== undefined) {
        updateData.weightUnit = validatedData.weightUnit;
      }
    } else if (exerciseType === 'cardio') {
      // Validate cardio fields if being updated
      if (validatedData.duration !== undefined) {
        updateData.duration = validatedData.duration;
      }
      if (validatedData.distance !== undefined) {
        updateData.distance = validatedData.distance;
      }
      if (validatedData.distanceUnit !== undefined) {
        updateData.distanceUnit = validatedData.distanceUnit;
      }
    }

    // Common fields that can be updated regardless of exercise type
    if (validatedData.completed !== undefined) {
      updateData.completed = validatedData.completed;
    }
    if (validatedData.setNumber !== undefined) {
      updateData.setNumber = validatedData.setNumber;
    }

    // Update set
    const updatedSet = await prisma.workoutSet.update({
      where: { id: setId },
      data: updateData,
    });

    res.json(updatedSet);
  } catch (error) {
    logError('Failed to update workout set', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.workoutId,
      exerciseId: req.params.exerciseId,
      setId: req.params.setId,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update workout set',
    });
  }
});

/**
 * DELETE /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
 * Delete a workout set
 *
 * Security: Validates workout belongs to authenticated user
 * Returns: 404 if workout/exercise/set not found, 204 No Content on success
 */
router.delete('/:workoutId/exercises/:exerciseId/sets/:setId', verifyCsrfToken, async (req, res) => {
  try {
    const { workoutId, exerciseId, setId } = req.params;
    const userId = (req.user as User).id;

    // Verify workout exercise exists and user owns the workout
    const workoutExercise = await verifyWorkoutExerciseOwnership(workoutId, exerciseId, userId, res);
    if (!workoutExercise) return; // Response already sent by helper

    // Verify set exists
    const existingSet = await prisma.workoutSet.findFirst({
      where: {
        id: setId,
        workoutExerciseId: exerciseId,
      },
    });

    if (!existingSet) {
      return res.status(404).json({
        error: 'Set not found',
        message: 'The requested set does not exist',
      });
    }

    // Delete set
    await prisma.workoutSet.delete({
      where: { id: setId },
    });

    res.status(204).end();
  } catch (error) {
    logError('Failed to delete workout set', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.workoutId,
      exerciseId: req.params.exerciseId,
      setId: req.params.setId,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete workout set',
    });
  }
});

export default router;
