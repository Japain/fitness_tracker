/**
 * Helper functions for workout route validation and verification
 * Consolidates duplicated logic across workout, exercise, and set routes
 */

import { prisma } from '../lib/prisma';
import { Response } from 'express';
import type { User } from '@fitness-tracker/shared';

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
 * Validates strength exercise set data
 * Returns true if valid, sends 400 response and returns false if invalid
 */
export function validateStrengthSetData(
  data: {
    reps?: number | null;
    weight?: number | null;
    weightUnit?: string | null;
  },
  res: Response,
  isUpdate: boolean = false
): boolean {
  // For updates, reps is optional. For creation, reps is required.
  if (!isUpdate && (data.reps === undefined || data.reps === null)) {
    res.status(400).json({
      error: 'Validation error',
      message: 'Reps are required for strength exercises',
    });
    return false;
  }

  if (data.reps !== undefined && data.reps !== null) {
    if (typeof data.reps !== 'number' || data.reps <= 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Reps must be a positive number',
      });
      return false;
    }
  }

  if (data.weight !== undefined && data.weight !== null) {
    if (typeof data.weight !== 'number' || data.weight < 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Weight must be a non-negative number',
      });
      return false;
    }
    if (data.weightUnit && !['lbs', 'kg', 'bodyweight'].includes(data.weightUnit)) {
      res.status(400).json({
        error: 'Validation error',
        message: 'weightUnit must be one of: lbs, kg, bodyweight',
      });
      return false;
    }
  }

  return true;
}

/**
 * Validates cardio exercise set data
 * Returns true if valid, sends 400 response and returns false if invalid
 */
export function validateCardioSetData(
  data: {
    duration?: number | null;
    distance?: number | null;
    distanceUnit?: string | null;
  },
  res: Response,
  isUpdate: boolean = false
): boolean {
  // For updates, duration is optional. For creation, duration is required.
  if (!isUpdate && (data.duration === undefined || data.duration === null)) {
    res.status(400).json({
      error: 'Validation error',
      message: 'Duration is required for cardio exercises',
    });
    return false;
  }

  if (data.duration !== undefined && data.duration !== null) {
    if (typeof data.duration !== 'number' || data.duration <= 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Duration must be a positive number (seconds)',
      });
      return false;
    }
  }

  if (data.distance !== undefined && data.distance !== null) {
    if (typeof data.distance !== 'number' || data.distance < 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Distance must be a non-negative number',
      });
      return false;
    }
    if (data.distanceUnit && !['miles', 'km'].includes(data.distanceUnit)) {
      res.status(400).json({
        error: 'Validation error',
        message: 'distanceUnit must be one of: miles, km',
      });
      return false;
    }
  }

  return true;
}
