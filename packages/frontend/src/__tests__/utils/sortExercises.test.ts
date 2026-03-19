import { describe, it, expect } from 'vitest';
import { sortExercises } from '../../utils/sortExercises';
import type { Exercise } from '@fitness-tracker/shared';

function makeExercise(overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'name' | 'category' | 'type'>): Exercise {
  return { isCustom: false, userId: null, createdAt: new Date(), ...overrides } as Exercise;
}

const exercises: Exercise[] = [
  makeExercise({ id: '1', name: 'Squat', category: 'Legs', type: 'strength' }),
  makeExercise({ id: '2', name: 'Bench Press', category: 'Push', type: 'strength' }),
  makeExercise({ id: '3', name: 'Running', category: 'Cardio', type: 'cardio' }),
  makeExercise({ id: '4', name: 'Pull-ups', category: 'Pull', type: 'strength' }),
  makeExercise({ id: '5', name: 'Plank', category: 'Core', type: 'strength' }),
  makeExercise({ id: '6', name: 'Arnold Press', category: 'Push', type: 'strength' }),
];

describe('sortExercises', () => {
  it('does not mutate the input array', () => {
    const originalOrder = exercises.map((e) => e.id);
    sortExercises(exercises, 'name');
    expect(exercises.map((e) => e.id)).toEqual(originalOrder);
  });

  describe('sortBy: "name"', () => {
    it('sorts exercises alphabetically A-Z by name', () => {
      const result = sortExercises(exercises, 'name');
      const names = result.map((e) => e.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    it('Arnold Press comes before Bench Press', () => {
      const result = sortExercises(exercises, 'name');
      const arnoldIdx = result.findIndex((e) => e.name === 'Arnold Press');
      const benchIdx = result.findIndex((e) => e.name === 'Bench Press');
      expect(arnoldIdx).toBeLessThan(benchIdx);
    });
  });

  describe('sortBy: "category"', () => {
    it('sorts by category in the defined order (Push → Pull → Legs → Core → Cardio)', () => {
      const result = sortExercises(exercises, 'category');
      const categories = result.map((e) => e.category);

      const pushIdx = categories.indexOf('Push');
      const pullIdx = categories.indexOf('Pull');
      const legsIdx = categories.indexOf('Legs');
      const coreIdx = categories.indexOf('Core');
      const cardioIdx = categories.indexOf('Cardio');

      expect(pushIdx).toBeLessThan(pullIdx);
      expect(pullIdx).toBeLessThan(legsIdx);
      expect(legsIdx).toBeLessThan(coreIdx);
      expect(coreIdx).toBeLessThan(cardioIdx);
    });

    it('sorts alphabetically within the same category', () => {
      const result = sortExercises(exercises, 'category');
      const pushExercises = result.filter((e) => e.category === 'Push');
      expect(pushExercises[0].name).toBe('Arnold Press');
      expect(pushExercises[1].name).toBe('Bench Press');
    });
  });

  it('returns a copy even when sortBy is an unrecognized value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = sortExercises(exercises, 'unknown' as any);
    expect(result).toHaveLength(exercises.length);
  });

  it('handles empty array without error', () => {
    expect(sortExercises([], 'name')).toEqual([]);
    expect(sortExercises([], 'category')).toEqual([]);
  });
});
