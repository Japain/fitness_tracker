/**
 * Exercise Library Routes
 * Handles fetching, creating, updating, and deleting exercises
 * Includes both pre-defined library exercises and user custom exercises
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { verifyCsrfToken } from '../middleware/csrf';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import { verifyExerciseOwnership } from '../utils/workoutHelpers';
import { logError } from '../utils/errorLogger';
import type { User } from '@fitness-tracker/shared';
import {
  exerciseListQuerySchema,
  createExerciseSchema,
  updateExerciseSchema,
  type ExerciseListQuery,
  type CreateExerciseInput,
  type UpdateExerciseInput,
} from '@fitness-tracker/shared/validators';
import type { Prisma } from '@prisma/client';

const router = Router();

/**
 * All exercise routes require authentication
 * This ensures req.user is available and typed
 */
router.use(requireAuth);

/**
 * GET /api/exercises
 * Fetch all exercises available to the user:
 * - All library exercises (isCustom = false, userId = null)
 * - User's custom exercises (isCustom = true, userId = req.user.id)
 *
 * Query params:
 * - category: Filter by category (Push, Pull, Legs, Core, Cardio)
 * - type: Filter by type (strength, cardio)
 * - search: Search by exercise name (case-insensitive partial match)
 *
 * @route GET /api/exercises
 * @access Protected
 */
router.get('/', validateQuery(exerciseListQuerySchema), async (req, res) => {
  try {
    const validatedQuery = req.validatedQuery as ExerciseListQuery;
    const { category, type, search } = validatedQuery;
    const userId = (req.user as User).id;

    // Build where clause with filters
    const where: Prisma.ExerciseWhereInput = {
      OR: [
        { isCustom: false, userId: null },  // Library exercises
        { isCustom: true, userId },         // User's custom exercises
      ],
    };

    // Apply category filter if provided
    if (category) {
      where.category = category;
    }

    // Apply type filter if provided
    if (type) {
      where.type = type;
    }

    // Apply search filter if provided (case-insensitive partial match)
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(exercises);
  } catch (error) {
    logError('Failed to fetch exercises', error, { userId: (req.user as User | undefined)?.id });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch exercises',
    });
  }
});

/**
 * POST /api/exercises
 * Create a new custom exercise
 *
 * Request body:
 * - name: Exercise name (1-100 characters, trimmed)
 * - category: Exercise category (Push, Pull, Legs, Core, Cardio)
 * - type: Exercise type (strength, cardio)
 *
 * Security: Sets isCustom=true and userId=req.user.id automatically
 * Validation: Prevents duplicate custom exercise names for same user
 * Returns: 201 Created with exercise object
 *
 * @route POST /api/exercises
 * @access Protected
 */
router.post('/', verifyCsrfToken, validateBody(createExerciseSchema), async (req, res) => {
  try {
    const { name, category, type } = req.validatedBody as CreateExerciseInput;
    const userId = (req.user as User).id;

    // Check for duplicate custom exercise name for this user
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        userId,
        isCustom: true,
      },
    });

    if (existingExercise) {
      return res.status(409).json({
        error: 'Duplicate exercise',
        message: 'You already have a custom exercise with this name',
      });
    }

    // Create custom exercise
    const exercise = await prisma.exercise.create({
      data: {
        name,
        category,
        type,
        isCustom: true,
        userId,
      },
    });

    res.status(201).json(exercise);
  } catch (error) {
    logError('Failed to create custom exercise', error, { userId: (req.user as User | undefined)?.id });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create custom exercise',
    });
  }
});

/**
 * PATCH /api/exercises/:id
 * Update a custom exercise
 *
 * Request body (all fields optional, at least one required):
 * - name: Exercise name (1-100 characters, trimmed)
 * - category: Exercise category (Push, Pull, Legs, Core, Cardio)
 * - type: Exercise type (strength, cardio)
 *
 * Security:
 * - Verifies exercise exists and belongs to user
 * - Prevents updating library exercises (isCustom=false)
 * - Returns 403 Forbidden if user doesn't own exercise or attempting to modify library exercise
 * - Returns 404 Not Found if exercise doesn't exist
 *
 * @route PATCH /api/exercises/:id
 * @access Protected
 */
router.patch('/:id', verifyCsrfToken, validateBody(updateExerciseSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedBody = req.validatedBody as UpdateExerciseInput;
    const userId = (req.user as User).id;

    // Verify ownership (also checks if exercise exists and is custom)
    const exercise = await verifyExerciseOwnership(id, userId, res);
    if (!exercise) {
      return; // Response already sent by verifyExerciseOwnership
    }

    // Check for duplicate name if name is being updated
    if (validatedBody.name && validatedBody.name !== exercise.name) {
      const existingExercise = await prisma.exercise.findFirst({
        where: {
          name: {
            equals: validatedBody.name,
            mode: 'insensitive',
          },
          userId,
          isCustom: true,
          id: { not: id }, // Exclude current exercise
        },
      });

      if (existingExercise) {
        return res.status(409).json({
          error: 'Duplicate exercise',
          message: 'You already have a custom exercise with this name',
        });
      }
    }

    // Build update data object
    const updateData: Prisma.ExerciseUpdateInput = {};
    if (validatedBody.name !== undefined) {
      updateData.name = validatedBody.name;
    }
    if (validatedBody.category !== undefined) {
      updateData.category = validatedBody.category;
    }
    if (validatedBody.type !== undefined) {
      updateData.type = validatedBody.type;
    }

    // Update exercise
    const updatedExercise = await prisma.exercise.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedExercise);
  } catch (error) {
    logError('Failed to update exercise', error, {
      userId: (req.user as User | undefined)?.id,
      exerciseId: req.params.id,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update exercise',
    });
  }
});

/**
 * DELETE /api/exercises/:id
 * Delete a custom exercise
 *
 * Security:
 * - Verifies exercise exists and belongs to user
 * - Prevents deleting library exercises (isCustom=false)
 * - Returns 403 Forbidden if user doesn't own exercise or attempting to delete library exercise
 * - Returns 404 Not Found if exercise doesn't exist
 *
 * Note: If exercise is used in any workouts, it will remain in those workouts
 * but won't be available for future workout creation. The exercise relationship
 * in WorkoutExercise is preserved (no cascade delete from Exercise side).
 *
 * @route DELETE /api/exercises/:id
 * @access Protected
 */
router.delete('/:id', verifyCsrfToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as User).id;

    // Verify ownership (also checks if exercise exists and is custom)
    const exercise = await verifyExerciseOwnership(id, userId, res);
    if (!exercise) {
      return; // Response already sent by verifyExerciseOwnership
    }

    // Delete custom exercise
    // Note: WorkoutExercise records referencing this exercise will remain
    // (no onDelete: Cascade from Exercise -> WorkoutExercise in schema)
    await prisma.exercise.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (error) {
    logError('Failed to delete exercise', error, {
      userId: (req.user as User | undefined)?.id,
      exerciseId: req.params.id,
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete exercise',
    });
  }
});

export default router;
