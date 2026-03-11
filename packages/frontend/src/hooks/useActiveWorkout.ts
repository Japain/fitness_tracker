import { useEffect } from 'react';
import useSWR from 'swr';
import type { WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { fetcher } from '../api/client';

const ACTIVE_WORKOUT_KEY = 'fitness-tracker:active-workout-id';

/**
 * Hook to fetch the active workout session.
 * Persists the active workout ID to localStorage as a fallback when offline.
 */
export function useActiveWorkout() {
  const { data, error, mutate, isLoading } = useSWR<WorkoutSessionWithExercises | null>(
    '/api/workouts/active',
    fetcher
  );

  // Persist active workout ID to localStorage when loaded
  useEffect(() => {
    if (data?.id) {
      try {
        localStorage.setItem(ACTIVE_WORKOUT_KEY, data.id);
      } catch {
        // Storage unavailable — ignore
      }
    } else if (data === null) {
      // Explicitly null means no active workout — clear the backup
      try {
        localStorage.removeItem(ACTIVE_WORKOUT_KEY);
      } catch {
        // Storage unavailable — ignore
      }
    }
  }, [data]);

  // Fallback ID from localStorage (used when network fails on initial load)
  const fallbackId = (() => {
    try {
      return localStorage.getItem(ACTIVE_WORKOUT_KEY);
    } catch {
      return null;
    }
  })();

  return {
    activeWorkout: data,
    activeWorkoutFallbackId: data === undefined ? fallbackId : null,
    isLoading,
    isError: error,
    refetch: mutate,
  };
}

export { ACTIVE_WORKOUT_KEY };
