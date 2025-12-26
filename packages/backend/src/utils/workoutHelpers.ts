/**
 * Helper functions for workout route validation and verification
 * Consolidates duplicated logic across workout, exercise, and set routes
 */

import { prisma } from '../lib/prisma';
import { Response } from 'express';
import type { User, Exercise } from '@fitness-tracker/shared';

/**
 * Verifies that a workout exists and belongs to the authenticated user
 * Returns the workout if found, sends 404 response and returns null if not found
 */
export async function verifyWorkoutOwnership(
  workoutId: string,
  userId: string,
  res: Response
) {
  const workout = await prisma.workoutSession.findFirst({
    where: {
      id: workoutId,
      userId, // CRITICAL: Filter by userId for data segregation
    },
  });

  if (!workout) {
    res.status(404).json({
      error: 'Workout not found',
      message: 'The requested workout does not exist or you do not have permission to access it',
    });
    return null;
  }

  return workout;
}

/**
 * Verifies that a workout exercise exists and belongs to the specified workout
 * Also verifies the workout belongs to the user
 * Returns the workout exercise with exercise details if found, sends appropriate error response and returns null if not found
 */
export async function verifyWorkoutExerciseOwnership(
  workoutId: string,
  exerciseId: string,
  userId: string,
  res: Response
) {
  // First verify workout ownership
  const workout = await verifyWorkoutOwnership(workoutId, userId, res);
  if (!workout) {
    return null; // Response already sent
  }

  // Then verify workout exercise exists
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
    res.status(404).json({
      error: 'Exercise not found',
      message: 'The requested exercise is not part of this workout',
    });
    return null;
  }

  return workoutExercise;
}

/**
 * Verifies that an exercise exists and belongs to the authenticated user (for custom exercises)
 * Returns the exercise if found and owned, sends appropriate error response and returns null if not found/forbidden
 */
export async function verifyExerciseOwnership(
  exerciseId: string,
  userId: string,
  res: Response
): Promise<Exercise | null> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) {
    res.status(404).json({
      error: 'Exercise not found',
      message: 'The requested exercise does not exist',
    });
    return null;
  }

  // Library exercises (isCustom = false) cannot be modified or deleted by anyone
  if (!exercise.isCustom) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Library exercises cannot be modified or deleted',
    });
    return null;
  }

  // Custom exercises can only be modified by their owner
  if (exercise.userId !== userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to modify this exercise',
    });
    return null;
  }

  return exercise as Exercise;
}
