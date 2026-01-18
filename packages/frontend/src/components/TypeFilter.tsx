import { HStack, Button, Heading, Box } from '@chakra-ui/react';

/**
 * TypeFilter Component
 * 3-button segmented control for filtering exercises by type
 *
 * Design reference: mockups/EXERCISE-LIBRARY-DESIGN-SPEC.md (TypeFilter section)
 * Used in: ExerciseLibraryPage
 *
 * Features:
 * - Segmented control with 3 equal-width buttons (All, Strength, Cardio)
 * - Single selection (mutually exclusive)
 * - Active state: primary-brand background
 * - 48px minimum height for mobile touch targets
 */
interface TypeFilterProps {
  selectedType: 'all' | 'strength' | 'cardio';
  onTypeChange: (type: 'all' | 'strength' | 'cardio') => void;
}

const TYPE_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'strength' as const, label: 'Strength' },
  { value: 'cardio' as const, label: 'Cardio' },
];

export function TypeFilter({ selectedType, onTypeChange }: TypeFilterProps) {
  return (
    <Box>
      <Heading
        fontSize="sm"
        fontWeight="semibold"
        color="neutral.600"
        textTransform="uppercase"
        letterSpacing="0.5px"
        mb="md"
      >
        Exercise Type
      </Heading>
      <HStack spacing="sm">
        {TYPE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            flex="1"
            h="48px"
            bg={selectedType === option.value ? 'primary.500' : 'white'}
            color={selectedType === option.value ? 'white' : 'neutral.700'}
            border="2px solid"
            borderColor={selectedType === option.value ? 'primary.500' : 'neutral.300'}
            borderRadius="md"
            fontSize="md"
            fontWeight="semibold"
            onClick={() => onTypeChange(option.value)}
            aria-pressed={selectedType === option.value}
            _hover={{
              bg: selectedType === option.value ? 'primary.600' : 'primary.500',
              color: 'white',
              borderColor: 'primary.500',
            }}
          >
            {option.label}
          </Button>
        ))}
      </HStack>
    </Box>
  );
}
