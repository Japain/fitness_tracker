/**
 * Exercise Library Routes
 * Handles fetching pre-defined and custom exercises for exercise selection
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { logError } from '../utils/errorLogger';
import type { User } from '@fitness-tracker/shared';

const router = Router();

/**
 * GET /api/exercises
 * Fetch all exercises available to the user:
 * - All library exercises (isCustom = false, userId = null)
 * - User's custom exercises (isCustom = true, userId = req.user.id)
 *
 * @route GET /api/exercises
 * @access Protected
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as User).id;

    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { isCustom: false },           // Library exercises
          { userId },                    // User's custom exercises
        ],
      },
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

export default router;
