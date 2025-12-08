import type { Exercise } from './exercise';

/**
 * WorkoutSession entity - represents a single workout session
 */
export interface WorkoutSession {
  id: string;                  // UUID
  userId: string;              // Foreign key to User
  startTime: Date;             // ISO 8601 timestamp
  endTime?: Date;              // Set when workout completed (null = active workout)
  notes?: string;              // Optional workout notes
  createdAt: Date;
  updatedAt: Date;
}

/**
 * WorkoutExercise entity - represents an exercise instance within a workout
 * This is a join entity between WorkoutSession and Exercise with ordering info
 */
export interface WorkoutExercise {
  id: string;                  // UUID
  workoutSessionId: string;    // Foreign key to WorkoutSession
  exerciseId: string;          // Foreign key to Exercise
  orderIndex: number;          // Order in workout (0, 1, 2...)
  notes?: string;              // Exercise-specific notes
  createdAt: Date;
}

/**
 * WorkoutSet entity - represents an individual set within a workout exercise
 * This follows the granular set storage architecture decision.
 *
 * For strength exercises: use reps, weight, weightUnit
 * For cardio exercises: use duration, distance, distanceUnit
 */
export interface WorkoutSet {
  id: string;                  // UUID
  workoutExerciseId: string;   // Foreign key to WorkoutExercise
  setNumber: number;           // 1, 2, 3...

  // Strength exercise fields (nullable)
  reps?: number;
  weight?: number;
  weightUnit?: 'lbs' | 'kg' | 'bodyweight';

  // Cardio exercise fields (nullable)
  duration?: number;           // seconds
  distance?: number;
  distanceUnit?: 'miles' | 'km';

  // Common fields
  completed: boolean;          // Set completion status
  createdAt: Date;
}

/**
 * Extended types for API responses that include nested relationships
 */

/**
 * WorkoutExercise with nested Exercise data
 * Returned by API when fetching workout details
 */
export interface WorkoutExerciseWithExercise extends WorkoutExercise {
  exercise: Exercise;
  sets?: WorkoutSet[];
}

/**
 * WorkoutSession with nested exercises and sets
 * Returned by API when fetching workout details
 */
export interface WorkoutSessionWithExercises extends WorkoutSession {
  exercises: WorkoutExerciseWithExercise[];
}
