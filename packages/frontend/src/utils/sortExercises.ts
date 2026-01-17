import { Exercise } from '@fitness-tracker/shared';

/**
 * Exercise Sorting Utility
 *
 * Centralized sorting logic for Exercise Library page.
 * Provides multiple sorting strategies based on user preference.
 */

export type ExerciseSortBy = 'name' | 'recent' | 'category';

/**
 * Sort exercises based on the selected sort strategy
 *
 * @param exercises - Array of exercises to sort
 * @param sortBy - Sorting strategy to apply
 * @param recentExerciseIds - Optional array of recent exercise IDs (for 'recent' sort)
 * @returns Sorted array of exercises
 */
export function sortExercises(
  exercises: Exercise[],
  sortBy: ExerciseSortBy,
  recentExerciseIds?: string[]
): Exercise[] {
  const sorted = [...exercises];

  switch (sortBy) {
    case 'name':
      // Alphabetical sorting by exercise name (A-Z)
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'recent':
      // Sort by recent usage, then alphabetically
      if (!recentExerciseIds || recentExerciseIds.length === 0) {
        // Fall back to alphabetical if no recent data
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      }

      return sorted.sort((a, b) => {
        const aIndex = recentExerciseIds.indexOf(a.id);
        const bIndex = recentExerciseIds.indexOf(b.id);

        // Recently used exercises appear first
        if (aIndex !== -1 && bIndex === -1) return -1;
        if (aIndex === -1 && bIndex !== -1) return 1;
        if (aIndex !== -1 && bIndex !== -1) {
          // Both are recent - sort by recency (lower index = more recent)
          return aIndex - bIndex;
        }

        // Neither are recent - sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'category':
      // Sort by category order, then alphabetically within each category
      const categoryOrder = ['Push', 'Pull', 'Legs', 'Core', 'Cardio'];

      return sorted.sort((a, b) => {
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);

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
