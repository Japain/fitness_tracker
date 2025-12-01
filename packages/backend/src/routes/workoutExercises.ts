import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { verifyCsrfToken } from '../middleware/csrf';
import { prisma } from '../lib/prisma';
import { logError } from '../utils/errorLogger';
import type { User } from '@fitness-tracker/shared';

const router = Router();

/**
 * All workout exercise routes require authentication
 */
router.use(requireAuth);

/**
 * POST /api/workouts/:workoutId/exercises
 * Add an exercise to a workout
 *
 * Request body:
 * - exerciseId: UUID of the exercise to add
 * - orderIndex: Position in the workout (0, 1, 2...)
 * - notes: Optional exercise-specific notes
 *
 * Security: Validates workout belongs to authenticated user
 * Returns: 404 if workout not found, 400 if exercise doesn't exist, 201 with created exercise instance
 */
router.post('/:workoutId/exercises', verifyCsrfToken, async (req, res) => {
  try {
    
    const { workoutId } = req.params;
    const { exerciseId, orderIndex, notes } = req.body;

    // Validate required fields
    if (!exerciseId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'exerciseId is required',
      });
    }

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

    // Verify exercise exists and user has access to it
    // User can access: library exercises (isCustom = false) OR their own custom exercises
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        OR: [
          { isCustom: false }, // Library exercise
          { userId: (req.user as User).id }, // User's custom exercise
        ],
      },
    });

    if (!exercise) {
      return res.status(400).json({
        error: 'Exercise not found',
        message: 'The requested exercise does not exist or you do not have permission to use it',
      });
    }

    // Determine orderIndex if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      // Get the current max orderIndex for this workout
      const maxOrderExercise = await prisma.workoutExercise.findFirst({
        where: { workoutSessionId: workoutId },
        orderBy: { orderIndex: 'desc' },
      });
      finalOrderIndex = maxOrderExercise ? maxOrderExercise.orderIndex + 1 : 0;
    }

    // Create workout exercise
    const workoutExercise = await prisma.workoutExercise.create({
      data: {
        workoutSessionId: workoutId,
        exerciseId,
        orderIndex: finalOrderIndex,
        notes: notes || null,
      },
      include: {
        exercise: true,
        sets: {
          orderBy: { setNumber: 'asc' },
        },
      },
    });

    res.status(201).json(workoutExercise);
  } catch (error) {
    logError('Failed to add exercise to workout', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.workoutId,
      exerciseId: req.body?.exerciseId,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add exercise to workout',
    });
  }
});

/**
 * GET /api/workouts/:workoutId/exercises
 * List all exercises in a workout
 *
 * Security: Validates workout belongs to authenticated user
 * Returns: 404 if workout not found, 200 with array of exercises ordered by orderIndex
 */
router.get('/:workoutId/exercises', async (req, res) => {
  try {
    
    const { workoutId } = req.params;

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

    // Fetch exercises with related data
    const exercises = await prisma.workoutExercise.findMany({
      where: { workoutSessionId: workoutId },
      include: {
        exercise: true,
        sets: {
          orderBy: { setNumber: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    res.json(exercises);
  } catch (error) {
    logError('Failed to fetch workout exercises', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.workoutId,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch workout exercises',
    });
  }
});

/**
 * PATCH /api/workouts/:workoutId/exercises/:exerciseId
 * Update a workout exercise (notes or order)
 *
 * Request body:
 * - orderIndex: New position in the workout
 * - notes: Updated exercise notes
 *
 * Security: Validates workout belongs to authenticated user
 * Returns: 404 if workout or exercise not found, 200 with updated exercise
 */
router.patch('/:workoutId/exercises/:exerciseId', verifyCsrfToken, async (req, res) => {
  try {
    
    const { workoutId, exerciseId } = req.params;
    const { orderIndex, notes } = req.body;

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
    const existingWorkoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: exerciseId,
        workoutSessionId: workoutId,
      },
    });

    if (!existingWorkoutExercise) {
      return res.status(404).json({
        error: 'Exercise not found',
        message: 'The requested exercise is not part of this workout',
      });
    }

    // Build update data
    const updateData: any = {};
    if (orderIndex !== undefined) {
      updateData.orderIndex = orderIndex;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Update workout exercise
    const updatedWorkoutExercise = await prisma.workoutExercise.update({
      where: { id: exerciseId },
      data: updateData,
      include: {
        exercise: true,
        sets: {
          orderBy: { setNumber: 'asc' },
        },
      },
    });

    res.json(updatedWorkoutExercise);
  } catch (error) {
    logError('Failed to update workout exercise', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.workoutId,
      exerciseId: req.params.exerciseId,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update workout exercise',
    });
  }
});

/**
 * DELETE /api/workouts/:workoutId/exercises/:exerciseId
 * Remove an exercise from a workout
 *
 * Security: Validates workout belongs to authenticated user
 * Note: Cascade deletes all sets for this exercise due to Prisma schema onDelete: Cascade
 * Returns: 404 if workout or exercise not found, 204 No Content on success
 */
router.delete('/:workoutId/exercises/:exerciseId', verifyCsrfToken, async (req, res) => {
  try {
    
    const { workoutId, exerciseId } = req.params;

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
    const existingWorkoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: exerciseId,
        workoutSessionId: workoutId,
      },
    });

    if (!existingWorkoutExercise) {
      return res.status(404).json({
        error: 'Exercise not found',
        message: 'The requested exercise is not part of this workout',
      });
    }

    // Delete workout exercise (cascade deletes sets)
    await prisma.workoutExercise.delete({
      where: { id: exerciseId },
    });

    res.status(204).end();
  } catch (error) {
    logError('Failed to delete workout exercise', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.workoutId,
      exerciseId: req.params.exerciseId,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete workout exercise',
    });
  }
});

export default router;
