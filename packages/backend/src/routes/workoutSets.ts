import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { verifyCsrfToken } from '../middleware/csrf';
import { prisma } from '../lib/prisma';
import { logError } from '../utils/errorLogger';
import type { User } from '@fitness-tracker/shared';


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
 * - reps: Number of repetitions
 * - weight: Weight value (optional for bodyweight)
 * - weightUnit: 'lbs' | 'kg' | 'bodyweight'
 *
 * For cardio exercises:
 * - duration: Duration in seconds
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
router.post('/:workoutId/exercises/:exerciseId/sets', verifyCsrfToken, async (req, res) => {
  try {
    
    const { workoutId, exerciseId } = req.params;
    const { setNumber, reps, weight, weightUnit, duration, distance, distanceUnit, completed } = req.body;

    // Verify workout exists and belongs to user
    const workout = await prisma.workoutSession.findFirst({
      where: {
        id: workoutId,
        userId: (req.user as User).id, // CRITICAL: Filter by userId
      },
    });

    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'The requested workout does not exist or you do not have permission to access it',
      });
    }

    // Verify workout exercise exists and get exercise type
    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: exerciseId,
        workoutSessionId: workoutId,
      },
      include: {
        exercise: true,
      },
    });

    if (!workoutExercise) {
      return res.status(404).json({
        error: 'Exercise not found',
        message: 'The requested exercise is not part of this workout',
      });
    }

    // Validate fields based on exercise type
    const exerciseType = workoutExercise.exercise.type;

    if (exerciseType === 'strength') {
      // Strength exercises require reps, optionally weight and weightUnit
      if (reps === undefined || reps === null) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Reps are required for strength exercises',
        });
      }
      if (typeof reps !== 'number' || reps <= 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Reps must be a positive number',
        });
      }
      // Validate weight if provided
      if (weight !== undefined && weight !== null) {
        if (typeof weight !== 'number' || weight < 0) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Weight must be a non-negative number',
          });
        }
        if (!weightUnit || !['lbs', 'kg', 'bodyweight'].includes(weightUnit)) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'weightUnit must be one of: lbs, kg, bodyweight',
          });
        }
      }
    } else if (exerciseType === 'cardio') {
      // Cardio exercises require duration, optionally distance and distanceUnit
      if (duration === undefined || duration === null) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Duration is required for cardio exercises',
        });
      }
      if (typeof duration !== 'number' || duration <= 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Duration must be a positive number (seconds)',
        });
      }
      // Validate distance if provided
      if (distance !== undefined && distance !== null) {
        if (typeof distance !== 'number' || distance < 0) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Distance must be a non-negative number',
          });
        }
        if (!distanceUnit || !['miles', 'km'].includes(distanceUnit)) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'distanceUnit must be one of: miles, km',
          });
        }
      }
    }

    // Determine setNumber if not provided
    let finalSetNumber = setNumber;
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

    // Build set data based on exercise type
    const setData: any = {
      workoutExerciseId: exerciseId,
      setNumber: finalSetNumber,
      completed: completed ?? false,
    };

    if (exerciseType === 'strength') {
      setData.reps = reps;
      setData.weight = weight ?? null;
      setData.weightUnit = weightUnit ?? null;
    } else if (exerciseType === 'cardio') {
      setData.duration = duration;
      setData.distance = distance ?? null;
      setData.distanceUnit = distanceUnit ?? null;
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
 * Validation: Ensures updated fields are valid for exercise type
 * Returns: 404 if workout/exercise/set not found, 400 for validation errors, 200 with updated set
 */
router.patch('/:workoutId/exercises/:exerciseId/sets/:setId', verifyCsrfToken, async (req, res) => {
  try {
    
    const { workoutId, exerciseId, setId } = req.params;
    const { reps, weight, weightUnit, duration, distance, distanceUnit, completed, setNumber } = req.body;

    // Verify workout exists and belongs to user
    const workout = await prisma.workoutSession.findFirst({
      where: {
        id: workoutId,
        userId: (req.user as User).id, // CRITICAL: Filter by userId
      },
    });

    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'The requested workout does not exist or you do not have permission to access it',
      });
    }

    // Verify workout exercise exists and get exercise type
    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: exerciseId,
        workoutSessionId: workoutId,
      },
      include: {
        exercise: true,
      },
    });

    if (!workoutExercise) {
      return res.status(404).json({
        error: 'Exercise not found',
        message: 'The requested exercise is not part of this workout',
      });
    }

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
    const updateData: any = {};

    if (exerciseType === 'strength') {
      // Validate strength fields if being updated
      if (reps !== undefined) {
        if (typeof reps !== 'number' || reps <= 0) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Reps must be a positive number',
          });
        }
        updateData.reps = reps;
      }
      if (weight !== undefined) {
        if (weight !== null && (typeof weight !== 'number' || weight < 0)) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Weight must be a non-negative number or null',
          });
        }
        updateData.weight = weight;
      }
      if (weightUnit !== undefined) {
        if (weightUnit !== null && !['lbs', 'kg', 'bodyweight'].includes(weightUnit)) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'weightUnit must be one of: lbs, kg, bodyweight, or null',
          });
        }
        updateData.weightUnit = weightUnit;
      }
    } else if (exerciseType === 'cardio') {
      // Validate cardio fields if being updated
      if (duration !== undefined) {
        if (typeof duration !== 'number' || duration <= 0) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Duration must be a positive number (seconds)',
          });
        }
        updateData.duration = duration;
      }
      if (distance !== undefined) {
        if (distance !== null && (typeof distance !== 'number' || distance < 0)) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Distance must be a non-negative number or null',
          });
        }
        updateData.distance = distance;
      }
      if (distanceUnit !== undefined) {
        if (distanceUnit !== null && !['miles', 'km'].includes(distanceUnit)) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'distanceUnit must be one of: miles, km, or null',
          });
        }
        updateData.distanceUnit = distanceUnit;
      }
    }

    // Common fields that can be updated regardless of exercise type
    if (completed !== undefined) {
      updateData.completed = Boolean(completed);
    }
    if (setNumber !== undefined) {
      if (typeof setNumber !== 'number' || setNumber < 1) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'setNumber must be a positive number',
        });
      }
      updateData.setNumber = setNumber;
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

    // Verify workout exists and belongs to user
    const workout = await prisma.workoutSession.findFirst({
      where: {
        id: workoutId,
        userId: (req.user as User).id, // CRITICAL: Filter by userId
      },
    });

    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'The requested workout does not exist or you do not have permission to access it',
      });
    }

    // Verify workout exercise exists
    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: exerciseId,
        workoutSessionId: workoutId,
      },
    });

    if (!workoutExercise) {
      return res.status(404).json({
        error: 'Exercise not found',
        message: 'The requested exercise is not part of this workout',
      });
    }

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
