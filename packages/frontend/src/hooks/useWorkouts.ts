import useSWR from 'swr';
import type { WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { fetcher } from '../api/client';

/**
 * Pagination metadata from backend API
 */
interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Workouts list response from backend
 */
interface WorkoutsListResponse {
  workouts: WorkoutSessionWithExercises[];
  pagination: PaginationMeta;
}

/**
 * Hook to fetch recent workouts with pagination
 * Used on Dashboard to show last 3 workouts
 */
export function useRecentWorkouts(limit: number = 3) {
  const { data, error, isLoading, mutate } = useSWR<WorkoutsListResponse>(
    `/api/workouts?limit=${limit}&offset=0`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    workouts: data?.workouts ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: mutate,
  };
}

/**
 * Hook to fetch weekly workout statistics
 * Calculates stats client-side from recent workouts
 *
 * Note: For production, consider creating a dedicated backend endpoint
 * for better performance with large datasets
 */
export function useWeeklyStats() {
  const { data, error, isLoading } = useSWR<WorkoutsListResponse>(
    '/api/workouts?limit=100&offset=0', // Fetch enough to cover typical weekly volume
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Cache stats for 10 seconds
    }
  );

  // Calculate weekly stats
  const stats = calculateWeeklyStats(data?.workouts ?? []);

  return {
    stats,
    isLoading,
    error,
  };
}

/**
 * Calculate weekly workout statistics
 * Filters workouts from the last 7 days and computes totals
 */
function calculateWeeklyStats(workouts: WorkoutSessionWithExercises[]) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter to last 7 days and completed workouts only
  const weeklyWorkouts = workouts.filter((workout) => {
    const startTime = new Date(workout.startTime);
    return startTime >= oneWeekAgo && workout.endTime != null;
  });

  // Count total workouts
  const totalWorkouts = weeklyWorkouts.length;

  // Calculate total duration in hours (only for completed workouts)
  const totalDuration = weeklyWorkouts.reduce((sum, workout) => {
    if (workout.endTime) {
      const start = new Date(workout.startTime).getTime();
      const end = new Date(workout.endTime).getTime();
      return sum + (end - start);
    }
    return sum;
  }, 0) / (1000 * 60 * 60); // Convert to hours

  // Count total unique exercises from all weekly workouts
  const totalExercises = weeklyWorkouts.reduce((sum, workout) => {
    return sum + (workout.exercises?.length || 0);
  }, 0);

  // Calculate total volume (sum of weight * reps for all strength sets)
  const totalVolume = weeklyWorkouts.reduce((sum, workout) => {
    return sum + (workout.exercises || []).reduce((exerciseSum: number, workoutExercise) => {
      return exerciseSum + (workoutExercise.sets || []).reduce((setSum: number, set) => {
        // Only count completed strength sets with weight
        if (set.completed && set.weight && set.reps) {
          return setSum + (set.weight * set.reps);
        }
        return setSum;
      }, 0);
    }, 0);
  }, 0);

  return {
    totalWorkouts,
    totalDuration, // Raw number in hours
    totalExercises,
    totalVolume,
  };
}
