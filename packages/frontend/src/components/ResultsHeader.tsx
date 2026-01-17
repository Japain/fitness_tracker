import { Flex, Text, Select } from '@chakra-ui/react';
import { ExerciseSortBy } from '../utils/sortExercises';

/**
 * ResultsHeader Component
 * Displays exercise count and sort dropdown
 *
 * Design reference: mockups/EXERCISE-LIBRARY-DESIGN-SPEC.md (Results Header section)
 * Used in: ExerciseLibraryPage
 *
 * Features:
 * - Shows count of filtered exercises
 * - Dropdown to change sorting strategy (Name, Recently Used, Category)
 * - Accessible select with proper labeling
 */
interface ResultsHeaderProps {
  count: number;
  sortBy: ExerciseSortBy;
  onSortChange: (sortBy: ExerciseSortBy) => void;
}

export function ResultsHeader({ count, sortBy, onSortChange }: ResultsHeaderProps) {
  return (
    <Flex justify="space-between" align="center" mb="md">
      <Text fontSize="sm" color="neutral.600">
        {count} {count === 1 ? 'exercise' : 'exercises'}
      </Text>

      <Select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as ExerciseSortBy)}
        size="sm"
        w="auto"
        minW="160px"
        h="36px"
        fontSize="sm"
        color="neutral.700"
        border="1px solid"
        borderColor="neutral.300"
        borderRadius="md"
        aria-label="Sort exercises by"
        _focus={{
          borderColor: 'primary.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
        }}
      >
        <option value="name">Sort by Name</option>
        <option value="recent">Recently Used</option>
        <option value="category">Sort by Category</option>
      </Select>
    </Flex>
  );
}
