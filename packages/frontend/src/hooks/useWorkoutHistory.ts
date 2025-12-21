import { useState } from 'react';
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
 * Hook to fetch workout history with pagination
 * Used on WorkoutHistory page to show all workouts
 *
 * @param limit - Number of workouts per page (default: 20)
 * @returns Workout list with pagination controls
 */
export function useWorkoutHistory(limit: number = 20) {
  const [offset, setOffset] = useState(0);

  const { data, error, isLoading, mutate } = useSWR<WorkoutsListResponse>(
    `/api/workouts?limit=${limit}&offset=${offset}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  /**
   * Go to next page
   */
  const nextPage = () => {
    if (data?.pagination.hasMore) {
      setOffset((prev) => prev + limit);
    }
  };

  /**
   * Go to previous page
   */
  const previousPage = () => {
    setOffset((prev) => Math.max(0, prev - limit));
  };

  /**
   * Reset to first page
   */
  const resetPagination = () => {
    setOffset(0);
  };

  return {
    workouts: data?.workouts ?? [],
    pagination: data?.pagination ?? {
      total: 0,
      limit,
      offset,
      hasMore: false,
    },
    isLoading,
    error,
    refetch: mutate,
    nextPage,
    previousPage,
    resetPagination,
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: data?.pagination.total ? Math.ceil(data.pagination.total / limit) : 0,
  };
}

/**
 * Hook to calculate monthly workout statistics
 * Calculates stats for the current month client-side
 *
 * Note: For production, consider creating a dedicated backend endpoint
 * for better performance with large datasets
 */
export function useMonthlyStats() {
  const { data, error, isLoading } = useSWR<WorkoutsListResponse>(
    '/api/workouts?limit=100&offset=0', // Fetch enough to cover typical monthly volume
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Cache stats for 10 seconds
    }
  );

  // Calculate monthly stats
  const stats = calculateMonthlyStats(data?.workouts ?? []);

  return {
    stats,
    isLoading,
    error,
  };
}

/**
 * Calculate monthly workout statistics
 * Filters workouts from the current month and computes totals
 */
function calculateMonthlyStats(workouts: WorkoutSessionWithExercises[]) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter to current month and completed workouts only
  const monthlyWorkouts = workouts.filter((workout) => {
    const startTime = new Date(workout.startTime);
    return startTime >= firstDayOfMonth && workout.endTime != null;
  });

  // Count total workouts this month
  const totalWorkouts = monthlyWorkouts.length;

  // Calculate total duration in hours (only for completed workouts)
  const totalDuration = monthlyWorkouts.reduce((sum, workout) => {
    if (workout.endTime) {
      const start = new Date(workout.startTime).getTime();
      const end = new Date(workout.endTime).getTime();
      return sum + (end - start);
    }
    return sum;
  }, 0) / (1000 * 60 * 60); // Convert to hours

  // Count total exercises from all monthly workouts
  const totalExercises = monthlyWorkouts.reduce((sum, workout) => {
    return sum + (workout.exercises?.length || 0);
  }, 0);

  return {
    totalWorkouts,
    totalDuration, // Raw number in hours
    totalExercises,
  };
}
