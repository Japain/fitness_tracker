import useSWR from 'swr';
import type { WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { fetcher } from '../api/client';

/**
 * Hook to fetch a single workout with all exercises and sets
 * Used on WorkoutDetail page to show complete workout information
 *
 * @param workoutId - The workout session ID to fetch
 * @returns Workout with nested exercises and sets
 */
export function useWorkoutDetail(workoutId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<WorkoutSessionWithExercises>(
    workoutId ? `/api/workouts/${workoutId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    workout: data,
    isLoading,
    error,
    refetch: mutate,
  };
}
