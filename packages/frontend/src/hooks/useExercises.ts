import useSWR from 'swr';
import type { Exercise } from '@fitness-tracker/shared';
import { fetcher } from '../api/client';

/**
 * Hook to fetch exercise library (pre-defined + user custom exercises)
 * Used in Exercise Selection Modal
 *
 * Backend endpoint: GET /api/exercises
 * Returns: Array of exercises (library exercises + user's custom exercises)
 */
export function useExercises() {
  const { data, error, isLoading, mutate } = useSWR<Exercise[]>(
    '/api/exercises',
    fetcher,
    {
      revalidateOnFocus: false, // Exercise library rarely changes
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    exercises: data ?? [],
    isLoading,
    error,
    refetch: mutate,
  };
}

/**
 * Get exercises by category
 * Client-side filtering for better UX
 */
export function useExercisesByCategory(category?: string) {
  const { exercises, isLoading, error, refetch } = useExercises();

  const filteredExercises = category
    ? exercises.filter((ex) => ex.category === category)
    : exercises;

  return {
    exercises: filteredExercises,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Search exercises by name
 * Client-side fuzzy search
 */
export function useExerciseSearch(query: string, category?: string) {
  const { exercises, isLoading, error, refetch } = useExercises();

  const searchResults = exercises.filter((exercise) => {
    const nameMatch = exercise.name.toLowerCase().includes(query.toLowerCase());
    const categoryMatch = category ? exercise.category === category : true;
    return nameMatch && categoryMatch;
  });

  return {
    exercises: searchResults,
    isLoading,
    error,
    refetch,
  };
}
