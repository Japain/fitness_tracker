/**
 * Exercise Library Routes
 * Handles fetching pre-defined and custom exercises for exercise selection
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

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
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { isCustom: false },           // Library exercises
          { userId: req.user.id },       // User's custom exercises
        ],
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({
      message: 'Failed to fetch exercises',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
