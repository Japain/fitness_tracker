import { describe, it, expect } from 'vitest';
import { filterExercises } from '../../utils/filterExercises';
import type { Exercise } from '@fitness-tracker/shared';

function makeExercise(overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'name' | 'category' | 'type'>): Exercise {
  return {
    isCustom: false,
    userId: null,
    createdAt: new Date(),
    ...overrides,
  } as Exercise;
}

const exercises: Exercise[] = [
  makeExercise({ id: '1', name: 'Bench Press', category: 'Push', type: 'strength' }),
  makeExercise({ id: '2', name: 'Pull-ups', category: 'Pull', type: 'strength' }),
  makeExercise({ id: '3', name: 'Running', category: 'Cardio', type: 'cardio' }),
  makeExercise({ id: '4', name: 'Bench Dips', category: 'Push', type: 'strength', isCustom: true }),
  makeExercise({ id: '5', name: 'Plank', category: 'Core', type: 'strength' }),
];

describe('filterExercises', () => {
  it('returns all exercises when no filters are provided', () => {
    expect(filterExercises(exercises, {})).toHaveLength(5);
  });

  it('returns all exercises when type is "all"', () => {
    expect(filterExercises(exercises, { type: 'all' })).toHaveLength(5);
  });

  it('returns all exercises when category is "All"', () => {
    expect(filterExercises(exercises, { category: 'All' })).toHaveLength(5);
  });

  describe('search filter', () => {
    it('filters by exact name match (case-insensitive)', () => {
      const result = filterExercises(exercises, { search: 'running' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('filters by partial name match', () => {
      const result = filterExercises(exercises, { search: 'bench' });
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id).sort()).toEqual(['1', '4']);
    });

    it('returns empty array when search matches nothing', () => {
      expect(filterExercises(exercises, { search: 'zzz-no-match' })).toHaveLength(0);
    });

    it('handles empty search string as no filter', () => {
      expect(filterExercises(exercises, { search: '' })).toHaveLength(5);
    });
  });

  describe('category filter', () => {
    it('filters by Push category', () => {
      const result = filterExercises(exercises, { category: 'Push' });
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.category === 'Push')).toBe(true);
    });

    it('filters by Cardio category', () => {
      const result = filterExercises(exercises, { category: 'Cardio' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('treats missing category as no filter', () => {
      expect(filterExercises(exercises, {})).toHaveLength(5);
    });
  });

  describe('type filter', () => {
    it('returns only strength exercises', () => {
      const result = filterExercises(exercises, { type: 'strength' });
      expect(result).toHaveLength(4);
      expect(result.every((e) => e.type === 'strength')).toBe(true);
    });

    it('returns only cardio exercises', () => {
      const result = filterExercises(exercises, { type: 'cardio' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Running');
    });
  });

  describe('combined filters (AND logic)', () => {
    it('applies search + category simultaneously', () => {
      const result = filterExercises(exercises, { search: 'bench', category: 'Push' });
      expect(result).toHaveLength(2);
    });

    it('applies all three filters simultaneously', () => {
      const result = filterExercises(exercises, {
        search: 'bench',
        category: 'Push',
        type: 'strength',
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty array when combined filters exclude everything', () => {
      const result = filterExercises(exercises, { search: 'running', category: 'Push' });
      expect(result).toHaveLength(0);
    });
  });

  it('handles empty input array', () => {
    expect(filterExercises([], { search: 'bench' })).toHaveLength(0);
  });
});
