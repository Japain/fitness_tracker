import useSWR from 'swr';
import type { WorkoutSession } from '@fitness-tracker/shared';
import { fetcher, ApiError } from '../api/client';

/**
 * Hook to fetch the active workout session
 * Returns null if no active workout exists
 *
 * Usage:
 * const { activeWorkout, isLoading, isError, refetch } = useActiveWorkout();
 */
export function useActiveWorkout() {
  const { data, error, mutate, isLoading } = useSWR<WorkoutSession | null>(
    '/api/workouts/active',
    fetcher,
    {
      // Don't retry if we get a 404 (no active workout)
      shouldRetryOnError: (err) => {
        if (err instanceof ApiError && err.status === 404) return false;
        return true;
      },
    }
  );

  return {
    activeWorkout: data,
    isLoading,
    isError: error,
    refetch: mutate,
  };
}
