import { Exercise } from '@fitness-tracker/shared';
import { EXERCISE_CATEGORIES, ExerciseCategory } from './exerciseValidation';

/**
 * Exercise Sorting Utility
 *
 * Centralized sorting logic for Exercise Library page.
 * Provides multiple sorting strategies based on user preference.
 */

export type ExerciseSortBy = 'name' | 'category';

/**
 * Sort exercises based on the selected sort strategy
 *
 * @param exercises - Array of exercises to sort
 * @param sortBy - Sorting strategy to apply
 * @returns Sorted array of exercises
 */
export function sortExercises(
  exercises: Exercise[],
  sortBy: ExerciseSortBy
): Exercise[] {
  const sorted = [...exercises];

  switch (sortBy) {
    case 'name':
      // Alphabetical sorting by exercise name (A-Z)
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'category':
      // Sort by category order, then alphabetically within each category
      // Use EXERCISE_CATEGORIES from validation to ensure consistency
      const categoryOrder = [...EXERCISE_CATEGORIES];

      return sorted.sort((a, b) => {
        const catA = a.category ? categoryOrder.indexOf(a.category as ExerciseCategory) : -1;
        const catB = b.category ? categoryOrder.indexOf(b.category as ExerciseCategory) : -1;

        // Handle unknown categories (indexOf returns -1 if not found)
        if (catA === -1 && catB === -1) {
          return a.name.localeCompare(b.name); // Both unknown - sort by name
        }
        if (catA === -1) return 1;  // Unknown categories go to end
        if (catB === -1) return -1;

        if (catA !== catB) {
          // Different categories - use category order
          return catA - catB;
        }

        // Same category - sort alphabetically by name
        return a.name.localeCompare(b.name);
      });

    default:
      return sorted;
  }
}
