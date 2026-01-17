import { Box, VStack, HStack, Text, Icon, Button, IconButton } from '@chakra-ui/react';
import { Exercise } from '@fitness-tracker/shared';

/**
 * ExerciseListItem Component
 * Reusable component for displaying exercises in lists
 *
 * Design reference: mockups/html/03-exercise-selection.html
 * Used in: ExerciseSelectionModal (selectable variant), ExerciseLibraryPage (actionable variant)
 *
 * Variants:
 * - selectable: For modal - click anywhere to select, hover changes to blue
 * - actionable: For library page - action buttons, badges, 2-row layout for custom exercises
 */

interface ExerciseListItemProps {
  exercise: Exercise;
  variant: 'selectable' | 'actionable';
  onSelect?: () => void; // For selectable variant (modal - click to add)
  onAddToWorkout?: () => void; // For actionable variant (library page)
  onEdit?: () => void; // For actionable variant (custom exercises only)
  onDelete?: () => void; // For actionable variant (custom exercises only)
  isDisabled?: boolean;
  isLoading?: boolean;
  showBadges?: boolean; // Show Custom/Strength/Cardio badges (actionable variant)
}

/**
 * Selectable variant - used in ExerciseSelectionModal
 * Entire card is clickable, hover state changes background and text color
 */
function SelectableVariant({
  exercise,
  onSelect,
  isDisabled,
}: {
  exercise: Exercise;
  onSelect?: () => void;
  isDisabled?: boolean;
}) {
  return (
    <Box
      as="button"
      w="full"
      p="lg"
      bg="white"
      border="1px solid"
      borderColor="neutral.200"
      borderRadius="md"
      cursor="pointer"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      transition="all 150ms ease-in-out"
      minH="56px"
      onClick={onSelect}
      disabled={isDisabled}
      _hover={{
        borderColor: 'primary.500',
        bg: 'primary.500',
        color: 'white',
        '.exercise-category': {
          color: 'whiteAlpha.800',
        },
        '.exercise-icon': {
          color: 'white',
        },
      }}
      _disabled={{
        opacity: 0.5,
        cursor: 'not-allowed',
      }}
    >
      <VStack align="flex-start" spacing="xs">
        <Text fontSize="md" fontWeight="semibold">
          {exercise.name}
        </Text>
        <Text className="exercise-category" fontSize="sm" color="neutral.600">
          {exercise.category} • {exercise.type === 'strength' ? 'Strength' : 'Cardio'}
        </Text>
      </VStack>
      <Icon
        className="exercise-icon"
        viewBox="0 0 24 24"
        boxSize="20px"
        color="neutral.400"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      </Icon>
    </Box>
  );
}

/**
 * Actionable variant - used in ExerciseLibraryPage
 * Has action buttons, badges, and different layouts for library vs custom exercises
 */
function ActionableVariant({
  exercise,
  onAddToWorkout,
  onEdit,
  onDelete,
  isLoading,
  showBadges,
}: {
  exercise: Exercise;
  onAddToWorkout?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  showBadges?: boolean;
}) {
  const isCustomExercise = exercise.isCustom;

  return (
    <Box
      w="full"
      p="lg"
      bg="white"
      border="1px solid"
      borderColor="neutral.200"
      borderRadius="md"
      transition="all 150ms ease-in-out"
      _hover={{
        borderColor: 'primary.500',
        boxShadow: 'md',
      }}
    >
      {/* Exercise Info */}
      <VStack align="stretch" spacing="sm">
        <HStack justify="space-between" align="flex-start">
          <VStack align="flex-start" spacing="xs" flex="1">
            <Text fontSize="md" fontWeight="semibold" color="neutral.900">
              {exercise.name}
            </Text>
            <Text fontSize="sm" color="neutral.600">
              {exercise.category} • {exercise.type === 'strength' ? 'Strength' : 'Cardio'}
            </Text>
          </VStack>

          {/* Badges (if enabled) */}
          {showBadges && (
            <HStack spacing="xs">
              {isCustomExercise && (
                <Box
                  px="md"
                  py="xs"
                  bg="primary.50"
                  color="primary.700"
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  Custom
                </Box>
              )}
            </HStack>
          )}
        </HStack>

        {/* Actions */}
        {isCustomExercise ? (
          // Custom exercise: 2-row layout with Add + Edit/Delete buttons
          <VStack spacing="sm" align="stretch">
            <Button
              w="full"
              h="44px"
              colorScheme="primary"
              onClick={onAddToWorkout}
              isLoading={isLoading}
              loadingText="Adding..."
            >
              Add to Workout
            </Button>
            <HStack spacing="sm">
              <Button
                flex="1"
                h="44px"
                variant="outline"
                leftIcon={
                  <Icon viewBox="0 0 24 24" boxSize="16px" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                    />
                  </Icon>
                }
                onClick={onEdit}
                isDisabled={isLoading}
              >
                Edit
              </Button>
              <IconButton
                aria-label="Delete exercise"
                icon={
                  <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                    />
                  </Icon>
                }
                variant="outline"
                colorScheme="red"
                h="44px"
                onClick={onDelete}
                isDisabled={isLoading}
                _hover={{
                  bg: 'error.50',
                }}
              />
            </HStack>
          </VStack>
        ) : (
          // Library exercise: Single full-width button
          <Button
            w="full"
            h="44px"
            colorScheme="primary"
            onClick={onAddToWorkout}
            isLoading={isLoading}
            loadingText="Adding..."
          >
            Add to Workout
          </Button>
        )}
      </VStack>
    </Box>
  );
}

/**
 * Main ExerciseListItem component
 * Renders the appropriate variant based on props
 */
export function ExerciseListItem({
  exercise,
  variant,
  onSelect,
  onAddToWorkout,
  onEdit,
  onDelete,
  isDisabled = false,
  isLoading = false,
  showBadges = false,
}: ExerciseListItemProps) {
  if (variant === 'selectable') {
    return <SelectableVariant exercise={exercise} onSelect={onSelect} isDisabled={isDisabled} />;
  }

  return (
    <ActionableVariant
      exercise={exercise}
      onAddToWorkout={onAddToWorkout}
      onEdit={onEdit}
      onDelete={onDelete}
      isLoading={isLoading}
      showBadges={showBadges}
    />
  );
}
