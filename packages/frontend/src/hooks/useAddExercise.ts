import { useSWRConfig } from 'swr';
import type { Exercise, WorkoutExerciseWithExercise, WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { apiRequest } from '../api/client';
import { requestQueue } from '../api/requestQueue';

interface AddExerciseParams {
  workoutId: string;
  exercise: Exercise;
  orderIndex: number;
}

interface AddExerciseResult {
  workoutExerciseId: string | null; // null if queued (offline)
  pending: boolean;
}

/**
 * Hook to add an exercise to a workout with optimistic UI.
 * Immediately updates the SWR cache, then confirms with the backend.
 * If offline, queues the request and keeps the optimistic entry.
 */
export function useAddExercise() {
  const { mutate } = useSWRConfig();

  const addExercise = async ({ workoutId, exercise, orderIndex }: AddExerciseParams): Promise<AddExerciseResult> => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const optimisticExercise: WorkoutExerciseWithExercise = {
      id: tempId,
      workoutSessionId: workoutId,
      exerciseId: exercise.id,
      orderIndex,
      notes: undefined,
      createdAt: new Date(),
      exercise,
      sets: [],
      _pending: true,
    };

    // Optimistically add to SWR cache for /api/workouts/active
    await mutate(
      '/api/workouts/active',
      (current: WorkoutSessionWithExercises | null | undefined) => {
        if (!current) return current;
        return {
          ...current,
          exercises: [...(current.exercises || []), optimisticExercise],
        };
      },
      false // Don't revalidate immediately
    );

    try {
      // Make the real API call
      const workoutExercise = await apiRequest<WorkoutExerciseWithExercise>(
        `/api/workouts/${workoutId}/exercises`,
        {
          method: 'POST',
          body: { exerciseId: exercise.id, orderIndex },
        }
      );

      // Trigger full revalidation — replaces optimistic entry with real data
      await mutate('/api/workouts/active');

      return { workoutExerciseId: workoutExercise.id, pending: false };
    } catch (error) {
      if (!navigator.onLine) {
        // Offline — queue the request; keep optimistic entry visible
        await requestQueue.enqueue(`/api/workouts/${workoutId}/exercises`, 'POST', {
          exerciseId: exercise.id,
          orderIndex,
        });
        return { workoutExerciseId: null, pending: true };
      }

      // Online but server error — rollback
      await mutate(
        '/api/workouts/active',
        (current: WorkoutSessionWithExercises | null | undefined) => {
          if (!current) return current;
          return {
            ...current,
            exercises: (current.exercises || []).filter((ex) => ex.id !== tempId),
          };
        },
        false
      );

      throw error;
    }
  };

  return { addExercise };
}
