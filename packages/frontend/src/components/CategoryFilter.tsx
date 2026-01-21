import { Box, HStack, Button, Heading } from '@chakra-ui/react';

/**
 * CategoryFilter Component
 * Horizontal scrolling category pills for filtering exercises
 *
 * Design reference: mockups/html/03-exercise-selection.html
 * Used in: ExerciseSelectionModal, ExerciseLibraryPage
 *
 * Features:
 * - Horizontal scrolling pills with 48px height
 * - Active state: primary-brand background
 * - Categories: All, Push, Pull, Legs, Core, Cardio
 * - Optional label and clear all button for Exercise Library page
 */
interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showLabel?: boolean;
  showClearAll?: boolean;
}

const CATEGORIES = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Cardio'];

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  showLabel = true,
  showClearAll = false,
}: CategoryFilterProps) {
  const handleClearAll = () => {
    onCategoryChange('All');
  };

  return (
    <Box>
      {showLabel && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb="md">
          <Heading
            fontSize="sm"
            fontWeight="semibold"
            color="neutral.600"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            Browse by Category
          </Heading>
          {showClearAll && selectedCategory !== 'All' && (
            <Button
              variant="ghost"
              size="sm"
              color="primary.500"
              onClick={handleClearAll}
              _hover={{
                bg: 'neutral.100',
              }}
            >
              Clear All
            </Button>
          )}
        </Box>
      )}
      <HStack
        spacing="sm"
        overflowX="auto"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            flexShrink={0}
            px="xl"
            h="48px"
            bg={selectedCategory === category ? 'primary.500' : 'white'}
            color={selectedCategory === category ? 'white' : 'neutral.700'}
            border="2px solid"
            borderColor={selectedCategory === category ? 'primary.500' : 'neutral.300'}
            borderRadius="full"
            fontSize="md"
            fontWeight="semibold"
            onClick={() => onCategoryChange(category)}
            aria-pressed={selectedCategory === category}
            _hover={{
              bg: selectedCategory === category ? 'primary.600' : 'primary.500',
              color: 'white',
              borderColor: 'primary.500',
            }}
          >
            {category}
          </Button>
        ))}
      </HStack>
    </Box>
  );
}
