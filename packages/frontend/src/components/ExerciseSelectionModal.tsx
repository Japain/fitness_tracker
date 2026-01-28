import { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Box,
  Icon,
  IconButton,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { Exercise, WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { useExercises } from '../hooks/useExercises';
import { apiRequest } from '../api/client';
import { ExerciseSearchBar } from './ExerciseSearchBar';
import { CategoryFilter } from './CategoryFilter';
import { ExerciseListItem } from './ExerciseListItem';
import { CustomExerciseForm, type CustomExerciseFormValues } from './CustomExerciseForm';
import { filterExercises } from '../utils/filterExercises';

/**
 * Exercise Selection Modal Component
 * Design reference: mockups/html/03-exercise-selection.html
 *
 * Features:
 * - Bottom sheet modal with slide-up animation
 * - Search input (extracted to ExerciseSearchBar)
 * - Recent exercises (3 items from localStorage)
 * - Category pills (extracted to CategoryFilter)
 * - Scrollable exercise list (using ExerciseListItem with selectable variant)
 * - "Create Custom Exercise" button with inline form (using CustomExerciseForm)
 */
interface ExerciseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string | undefined;
  workout: WorkoutSessionWithExercises;
  onExerciseAdded: () => void;
}

const RECENT_EXERCISES_KEY = 'fitness-tracker:recent-exercises';

function ExerciseSelectionModal({
  isOpen,
  onClose,
  workoutId,
  workout,
  onExerciseAdded,
}: ExerciseSelectionModalProps) {
  const toast = useToast();
  const { exercises, isLoading, refetch } = useExercises();

  // Validate workoutId is provided
  if (!workoutId) {
    console.error('ExerciseSelectionModal: workoutId is required');
    return null;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recentExerciseIds, setRecentExerciseIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Custom exercise creation state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load recent exercises from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_EXERCISES_KEY);
      if (stored) {
        setRecentExerciseIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent exercises:', error);
      // Clear corrupted data from localStorage
      localStorage.removeItem(RECENT_EXERCISES_KEY);
      setRecentExerciseIds([]);
    }
  }, []); // Load once on mount, not on every modal open

  // Get recent exercises (max 3)
  const recentExercises = useMemo(() => {
    return recentExerciseIds
      .map((id) => exercises.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => ex !== undefined)
      .slice(0, 3);
  }, [exercises, recentExerciseIds]);

  // Filter exercises by search and category using utility
  const filteredExercises = useMemo(() => {
    return filterExercises(exercises, {
      search: searchQuery,
      category: selectedCategory,
    });
  }, [exercises, searchQuery, selectedCategory]);

  /**
   * Add exercise to recent list (localStorage)
   */
  const addToRecentExercises = (exerciseId: string) => {
    try {
      // Move to front of list, remove duplicates
      const updated = [exerciseId, ...recentExerciseIds.filter((id) => id !== exerciseId)].slice(
        0,
        10
      ); // Keep max 10
      localStorage.setItem(RECENT_EXERCISES_KEY, JSON.stringify(updated));
      setRecentExerciseIds(updated);
    } catch (error) {
      console.error('Failed to save recent exercise:', error);
      // Clear corrupted data from localStorage
      localStorage.removeItem(RECENT_EXERCISES_KEY);
      setRecentExerciseIds([]);
    }
  };

  /**
   * Handle exercise selection
   * Adds exercise to workout and creates initial set
   */
  const handleSelectExercise = async (exercise: Exercise) => {
    setIsAdding(true);

    try {
      // Get current exercise count from workout for orderIndex
      const orderIndex = workout.exercises?.length || 0;

      // Add exercise to workout
      const workoutExercise = await apiRequest<{ id: string }>(`/api/workouts/${workoutId}/exercises`, {
        method: 'POST',
        body: {
          exerciseId: exercise.id,
          orderIndex,
        },
      });

      // Create initial set with default values based on exercise type
      const isStrength = exercise.type === 'strength';
      const initialSetData = isStrength
        ? {
            setNumber: 1,
            reps: 1, // Default to 1 rep (user will update)
            weight: null, // Optional field
            weightUnit: 'lbs' as const,
            completed: false,
          }
        : {
            setNumber: 1,
            duration: 60, // Default to 60 seconds (1 minute)
            distance: null, // Optional field
            distanceUnit: 'km' as const,
            completed: false,
          };

      await apiRequest(
        `/api/workouts/${workoutId}/exercises/${workoutExercise.id}/sets`,
        {
          method: 'POST',
          body: initialSetData,
        }
      );

      // Add to recent exercises
      addToRecentExercises(exercise.id);

      toast({
        title: 'Exercise added',
        description: `${exercise.name} added to workout`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

      // Refresh workout data
      onExerciseAdded();

      // Close modal
      onClose();

      // Reset state
      setSearchQuery('');
      setSelectedCategory('All');
      setShowCreateForm(false);
    } catch (error) {
      // TODO: Implement centralized error handling pattern
      toast({
        title: 'Failed to add exercise',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while adding the exercise. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Handle custom exercise creation and immediate addition to workout
   */
  const handleCreateCustomExercise = async (values: CustomExerciseFormValues) => {
    setIsAdding(true);
    let createdExercise: Exercise | null = null;

    try {
      // Create custom exercise
      createdExercise = await apiRequest<Exercise>('/api/exercises', {
        method: 'POST',
        body: values,
      });

      // Refresh exercise list to include new custom exercise
      await refetch();

      // Add the newly created exercise to the workout immediately
      await handleSelectExercise(createdExercise);

      toast({
        title: 'Exercise created',
        description: `${createdExercise.name} created and added to workout successfully`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      const isCreationSucceeded = createdExercise !== null;

      toast({
        title: isCreationSucceeded
          ? 'Exercise created, but could not be added to workout'
          : 'Failed to create exercise',
        description: error instanceof Error
          ? error.message
          : isCreationSucceeded
            ? 'The exercise was created successfully, but an error occurred while adding it to the workout. You can add it manually from the exercise list.'
            : 'An unexpected error occurred while creating the exercise. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Toggle create form visibility
   */
  const handleToggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent
        borderTopRadius="md"
        borderBottomRadius="0"
        maxH="90vh"
        mt="auto"
        mb="0"
        display="flex"
        flexDirection="column"
      >
        {/* Modal Header */}
        <ModalHeader
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          borderBottom="1px solid"
          borderBottomColor="neutral.200"
          py="lg"
          px="lg"
        >
          <Heading size="md" color="neutral.900">
            Add Exercise
          </Heading>
          <IconButton
            aria-label="Close modal"
            icon={
              <Icon viewBox="0 0 24 24" boxSize="24px" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </Icon>
            }
            variant="ghost"
            color="neutral.600"
            onClick={onClose}
            minH="44px"
            minW="44px"
            _hover={{
              bg: 'neutral.100',
            }}
          />
        </ModalHeader>

        <ModalBody p="0" flex="1" overflow="hidden" display="flex" flexDirection="column">
          {/* Search Section */}
          <Box p="lg" borderBottom="1px solid" borderBottomColor="neutral.200">
            <ExerciseSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search exercises..."
            />
          </Box>

          {/* Recent Exercises Section */}
          {!searchQuery && recentExercises.length > 0 && (
            <Box p="lg" borderBottom="1px solid" borderBottomColor="neutral.200">
              <Heading
                fontSize="sm"
                fontWeight="semibold"
                color="neutral.600"
                textTransform="uppercase"
                letterSpacing="0.5px"
                mb="md"
              >
                Recent Exercises
              </Heading>
              <VStack spacing="sm" align="stretch">
                {recentExercises.map((exercise) => (
                  <ExerciseListItem
                    key={exercise.id}
                    exercise={exercise}
                    variant="selectable"
                    onSelect={() => handleSelectExercise(exercise)}
                    isDisabled={isAdding}
                  />
                ))}
              </VStack>
            </Box>
          )}

          {/* Category Pills */}
          <Box p="lg" borderBottom="1px solid" borderBottomColor="neutral.200">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              showLabel={true}
              showClearAll={false}
            />
          </Box>

          {/* Exercise List */}
          <Box flex="1" overflowY="auto" p="lg">
            {isLoading ? (
              <Text color="neutral.600" textAlign="center" py="xl">
                Loading exercises...
              </Text>
            ) : filteredExercises.length === 0 ? (
              <Text color="neutral.600" textAlign="center" py="xl">
                No exercises found
              </Text>
            ) : (
              <VStack spacing="sm" align="stretch">
                {filteredExercises.map((exercise) => (
                  <ExerciseListItem
                    key={exercise.id}
                    exercise={exercise}
                    variant="selectable"
                    onSelect={() => handleSelectExercise(exercise)}
                    isDisabled={isAdding}
                  />
                ))}
              </VStack>
            )}
          </Box>

          {/* Create Custom Exercise Section */}
          <Box p="lg" borderTop="1px solid" borderTopColor="neutral.200">
            {!showCreateForm ? (
              <Button
                w="full"
                h="56px"
                bg="neutral.100"
                border="1px dashed"
                borderColor="neutral.400"
                borderRadius="md"
                color="neutral.700"
                fontSize="md"
                fontWeight="semibold"
                leftIcon={
                  <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                    <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </Icon>
                }
                onClick={handleToggleCreateForm}
                _hover={{
                  bg: 'neutral.200',
                  borderColor: 'neutral.500',
                }}
              >
                Create Custom Exercise
              </Button>
            ) : (
              <VStack align="stretch" spacing="md">
                <HStack justify="space-between" align="center">
                  <Heading fontSize="sm" fontWeight="semibold" color="neutral.900">
                    Create Custom Exercise
                  </Heading>
                  <IconButton
                    aria-label="Cancel create exercise"
                    icon={
                      <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </Icon>
                    }
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleCreateForm}
                    minH="44px"
                    minW="44px"
                    _hover={{
                      bg: 'neutral.100',
                    }}
                  />
                </HStack>

                <CustomExerciseForm
                  mode="create"
                  onSubmit={handleCreateCustomExercise}
                  onCancel={handleToggleCreateForm}
                  isLoading={isAdding}
                  submitButtonText="Create & Add"
                />
              </VStack>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default ExerciseSelectionModal;
