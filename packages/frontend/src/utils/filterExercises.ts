import { Exercise } from '@fitness-tracker/shared';

/**
 * Exercise Filtering Utility
 *
 * Centralized filtering logic for exercises used across:
 * - ExerciseSelectionModal
 * - ExerciseLibraryPage
 *
 * This utility ensures consistent filtering behavior and reduces code duplication.
 */

export interface ExerciseFilters {
  search?: string;
  category?: string; // 'All' or category name
  type?: 'all' | 'strength' | 'cardio';
}

/**
 * Filter exercises based on search query, category, and type
 *
 * @param exercises - Array of exercises to filter
 * @param filters - Filtering criteria
 * @returns Filtered array of exercises
 */
export function filterExercises(exercises: Exercise[], filters: ExerciseFilters): Exercise[] {
  return exercises.filter((exercise) => {
    // Search filter (case-insensitive partial match on exercise name)
    const matchesSearch = !filters.search ||
      exercise.name.toLowerCase().includes(filters.search.toLowerCase());

    // Category filter
    const matchesCategory = !filters.category ||
      filters.category === 'All' ||
      exercise.category === filters.category;

    // Type filter
    const matchesType = !filters.type ||
      filters.type === 'all' ||
      exercise.type === filters.type;

    return matchesSearch && matchesCategory && matchesType;
  });
}
