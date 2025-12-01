import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { verifyCsrfToken } from '../middleware/csrf';
import { prisma } from '../lib/prisma';
import { logError } from '../utils/errorLogger';
import type { User } from '@fitness-tracker/shared';

const router = Router();

/**
 * All workout routes require authentication
 * This ensures req.user is available and typed
 */
router.use(requireAuth);

/**
 * POST /api/workouts
 * Create a new workout session
 *
 * Security: Checks for existing active workout (409 Conflict)
 * Returns: Created workout with 201 status
 */
router.post('/', verifyCsrfToken, async (req, res) => {
  try {
    const { startTime, notes } = req.body;

    // Check for existing active workout (conflict detection)
    const activeWorkout = await prisma.workoutSession.findFirst({
      where: {
        userId: (req.user as User).id,
        endTime: null,
      },
    });

    if (activeWorkout) {
      return res.status(409).json({
        error: 'Active workout exists',
        message: 'You already have an active workout in progress. Please complete it before starting a new one.',
        activeWorkoutId: activeWorkout.id,
      });
    }

    // Create new workout session
    const workout = await prisma.workoutSession.create({
      data: {
        userId: (req.user as User).id,
        startTime: startTime ? new Date(startTime) : new Date(),
        notes: notes || null,
      },
    });

    res.status(201).json(workout);
  } catch (error) {
    logError('Failed to create workout session', error, { userId: (req.user as User | undefined)?.id });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create workout session',
    });
  }
});

/**
 * GET /api/workouts
 * List user's workouts with pagination
 *
 * Query params:
 * - limit: Number of workouts to return (default: 20, max: 100)
 * - offset: Number of workouts to skip (default: 0)
 * - status: Filter by status ('active', 'completed', 'all') (default: 'all')
 *
 * Returns: Array of workouts ordered by startTime descending
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const status = (req.query.status as string) || 'all';

    // Build where clause based on status filter
    const where: any = { userId: (req.user as User).id };
    if (status === 'active') {
      where.endTime = null;
    } else if (status === 'completed') {
      where.endTime = { not: null };
    }

    // Fetch workouts with pagination
    const [workouts, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: offset,
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      }),
      prisma.workoutSession.count({ where }),
    ]);

    res.json({
      workouts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logError('Failed to fetch workouts', error, { userId: (req.user as User | undefined)?.id });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch workouts',
    });
  }
});

/**
 * GET /api/workouts/active
 * Get current active workout (if any)
 *
 * Active workout detection: WHERE endTime IS NULL
 * Returns: 204 No Content if no active workout
 * Returns: 200 with workout data (including exercises and sets) if active workout exists
 */
router.get('/active', async (req, res) => {
  try {
    const activeWorkout = await prisma.workoutSession.findFirst({
      where: {
        userId: (req.user as User).id,
        endTime: null,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!activeWorkout) {
      return res.status(204).end();
    }

    res.json(activeWorkout);
  } catch (error) {
    logError('Failed to fetch active workout', error, { userId: (req.user as User | undefined)?.id });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch active workout',
    });
  }
});

/**
 * GET /api/workouts/:id
 * Get specific workout by ID with all exercises and sets
 *
 * Security: Validates workout belongs to authenticated user
 * Returns: 404 if workout not found or doesn't belong to user
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workout = await prisma.workoutSession.findFirst({
      where: {
        id,
        userId: (req.user as User).id, // CRITICAL: Filter by userId for data segregation
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'The requested workout does not exist or you do not have permission to access it',
      });
    }

    res.json(workout);
  } catch (error) {
    logError('Failed to fetch workout by ID', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.id
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch workout',
    });
  }
});

/**
 * PATCH /api/workouts/:id
 * Update workout (typically to set endTime or update notes)
 *
 * Request body:
 * - endTime: ISO 8601 timestamp (to complete workout)
 * - notes: String (to update workout notes)
 *
 * Security: Validates workout belongs to authenticated user
 * Returns: 404 if workout not found, 200 with updated workout
 */
router.patch('/:id', verifyCsrfToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { endTime, notes } = req.body;

    // First verify workout exists and belongs to user
    const existingWorkout = await prisma.workoutSession.findFirst({
      where: {
        id,
        userId: (req.user as User).id, // CRITICAL: Filter by userId
      },
    });

    if (!existingWorkout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'The requested workout does not exist or you do not have permission to access it',
      });
    }

    // Build update data object
    const updateData: any = {};
    if (endTime !== undefined) {
      updateData.endTime = endTime ? new Date(endTime) : null;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Update workout
    const updatedWorkout = await prisma.workoutSession.update({
      where: { id },
      data: updateData,
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    res.json(updatedWorkout);
  } catch (error) {
    logError('Failed to update workout', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.id
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update workout',
    });
  }
});

/**
 * DELETE /api/workouts/:id
 * Delete a workout session
 *
 * Security: Validates workout belongs to authenticated user
 * Note: Cascade deletes exercises and sets due to Prisma schema onDelete: Cascade
 * Returns: 404 if workout not found, 204 No Content on success
 */
router.delete('/:id', verifyCsrfToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First verify workout exists and belongs to user
    const existingWorkout = await prisma.workoutSession.findFirst({
      where: {
        id,
        userId: (req.user as User).id, // CRITICAL: Filter by userId
      },
    });

    if (!existingWorkout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'The requested workout does not exist or you do not have permission to access it',
      });
    }

    // Delete workout (cascade deletes exercises and sets)
    await prisma.workoutSession.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (error) {
    logError('Failed to delete workout', error, {
      userId: (req.user as User | undefined)?.id,
      workoutId: req.params.id
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete workout',
    });
  }
});

export default router;
