import { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  IconButton,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  useToast,
  Select,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Radio,
  RadioGroup,
} from '@chakra-ui/react';
import { Exercise, WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { useExercises } from '../hooks/useExercises';
import { apiRequest } from '../api/client';
// Import validation constants and schema
import { z } from 'zod';

// TODO: Import from @fitness-tracker/shared/validators once Vite CommonJS compatibility is resolved
// Currently duplicated due to Vite build issue with CommonJS barrel exports from shared package
// Tracking issue: Vite cannot resolve CommonJS modules from @fitness-tracker/shared/validators
// Temporary workaround: Define locally (matches @fitness-tracker/shared/validators/exercise)
const EXERCISE_CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio'] as const;
const EXERCISE_TYPES = ['strength', 'cardio'] as const;

const createExerciseSchema = z.object({
  name: z.string()
    .min(1, { message: 'Exercise name is required' })
    .max(100, { message: 'Exercise name must be 100 characters or less' })
    .transform((val) => val.trim()),
  category: z.enum(EXERCISE_CATEGORIES, {
    errorMap: () => ({ message: 'Category must be one of: Push, Pull, Legs, Core, Cardio' }),
  }),
  type: z.enum(EXERCISE_TYPES, {
    errorMap: () => ({ message: 'Type must be either strength or cardio' }),
  }),
});

/**
 * Exercise Selection Modal Component
 * Design reference: mockups/html/03-exercise-selection.html
 *
 * Features:
 * - Bottom sheet modal with slide-up animation
 * - Search input
 * - Recent exercises (3 items from localStorage)
 * - Category pills (Push, Pull, Legs, Core, Cardio)
 * - Scrollable exercise list
 * - "Create Custom Exercise" button
 */
interface ExerciseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string | undefined;
  workout: WorkoutSessionWithExercises;
  onExerciseAdded: () => void;
}

const CATEGORIES = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Cardio'];
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
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseCategory, setCustomExerciseCategory] = useState<string>('Push');
  const [customExerciseType, setCustomExerciseType] = useState<string>('strength');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Filter exercises by search and category
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || exercise.category === selectedCategory;
      return matchesSearch && matchesCategory;
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
   * Adds exercise to workout and closes modal
   */
  const handleSelectExercise = async (exercise: Exercise) => {
    setIsAdding(true);

    try {
      // Get current exercise count from workout for orderIndex
      const orderIndex = workout.exercises?.length || 0;

      await apiRequest(`/api/workouts/${workoutId}/exercises`, {
        method: 'POST',
        body: {
          exerciseId: exercise.id,
          orderIndex,
        },
      });

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
      setCustomExerciseName('');
      setCustomExerciseCategory('Push');
      setCustomExerciseType('strength');
      setFormErrors({});
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
  const handleCreateCustomExercise = async () => {
    // Clear previous errors
    setFormErrors({});

    // Validate input using Zod schema
    const validationResult = createExerciseSchema.safeParse({
      name: customExerciseName,
      category: customExerciseCategory,
      type: customExerciseType,
    });

    if (!validationResult.success) {
      // Convert Zod errors to form errors
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
        if (err.path.length > 0) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setIsAdding(true);
    let createdExercise: Exercise | null = null;

    try {
      // Create custom exercise
      createdExercise = await apiRequest<Exercise>('/api/exercises', {
        method: 'POST',
        body: validationResult.data,
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
    if (showCreateForm) {
      // Reset form when closing
      setCustomExerciseName('');
      setCustomExerciseCategory('Push');
      setCustomExerciseType('strength');
      setFormErrors({});
    }
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
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="52px">
                <Icon viewBox="0 0 24 24" boxSize="20px" color="neutral.500" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                  />
                </Icon>
              </InputLeftElement>
              <Input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                inputMode="search"
                h="52px"
                pl="48px"
                fontSize="md"
                border="2px solid"
                borderColor="neutral.300"
                borderRadius="md"
                _focus={{
                  borderColor: 'primary.500',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                }}
                _placeholder={{
                  color: 'neutral.500',
                }}
              />
            </InputGroup>
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
                  <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => handleSelectExercise(exercise)}
                    isDisabled={isAdding}
                  />
                ))}
              </VStack>
            </Box>
          )}

          {/* Category Pills */}
          <Box p="lg" borderBottom="1px solid" borderBottomColor="neutral.200">
            <Heading
              fontSize="sm"
              fontWeight="semibold"
              color="neutral.600"
              textTransform="uppercase"
              letterSpacing="0.5px"
              mb="md"
            >
              Browse by Category
            </Heading>
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
                  onClick={() => setSelectedCategory(category)}
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
                  <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => handleSelectExercise(exercise)}
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

                {/* Exercise Name */}
                <FormControl isInvalid={!!formErrors.name}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color="neutral.700" mb="xs">
                    Exercise Name
                  </FormLabel>
                  <Input
                    type="text"
                    placeholder="e.g., Dumbbell Curl"
                    value={customExerciseName}
                    onChange={(e) => setCustomExerciseName(e.target.value)}
                    h="52px"
                    fontSize="md"
                    border="2px solid"
                    borderColor={formErrors.name ? 'error.500' : 'neutral.300'}
                    borderRadius="md"
                    _focus={{
                      borderColor: formErrors.name ? 'error.500' : 'primary.500',
                      boxShadow: formErrors.name
                        ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                        : '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                  />
                  {formErrors.name && (
                    <FormErrorMessage fontSize="sm">{formErrors.name}</FormErrorMessage>
                  )}
                </FormControl>

                {/* Exercise Category */}
                <FormControl isInvalid={!!formErrors.category}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color="neutral.700" mb="xs">
                    Category
                  </FormLabel>
                  <Select
                    value={customExerciseCategory}
                    onChange={(e) => setCustomExerciseCategory(e.target.value)}
                    h="52px"
                    fontSize="md"
                    border="2px solid"
                    borderColor={formErrors.category ? 'error.500' : 'neutral.300'}
                    borderRadius="md"
                    _focus={{
                      borderColor: formErrors.category ? 'error.500' : 'primary.500',
                      boxShadow: formErrors.category
                        ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                        : '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                  >
                    {EXERCISE_CATEGORIES.map((category: string) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                  {formErrors.category && (
                    <FormErrorMessage fontSize="sm">{formErrors.category}</FormErrorMessage>
                  )}
                </FormControl>

                {/* Exercise Type */}
                <FormControl isInvalid={!!formErrors.type}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color="neutral.700" mb="xs">
                    Type
                  </FormLabel>
                  <RadioGroup
                    value={customExerciseType}
                    onChange={setCustomExerciseType}
                  >
                    <HStack spacing="lg">
                      {EXERCISE_TYPES.map((type: string) => (
                        <Radio
                          key={type}
                          value={type}
                          colorScheme="primary"
                          size="lg"
                          borderColor={formErrors.type ? 'error.500' : 'neutral.300'}
                        >
                          <Text fontSize="md" color="neutral.700" textTransform="capitalize">
                            {type}
                          </Text>
                        </Radio>
                      ))}
                    </HStack>
                  </RadioGroup>
                  {formErrors.type && (
                    <FormErrorMessage fontSize="sm">{formErrors.type}</FormErrorMessage>
                  )}
                </FormControl>

                {/* Create Button */}
                <HStack spacing="md">
                  <Button
                    flex="1"
                    h="52px"
                    variant="outline"
                    onClick={handleToggleCreateForm}
                    isDisabled={isAdding}
                  >
                    Cancel
                  </Button>
                  <Button
                    flex="1"
                    h="52px"
                    colorScheme="primary"
                    onClick={handleCreateCustomExercise}
                    isLoading={isAdding}
                    loadingText="Creating..."
                  >
                    Create & Add
                  </Button>
                </HStack>
              </VStack>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/**
 * Exercise Item Component
 * Individual exercise in the list
 */
interface ExerciseItemProps {
  exercise: Exercise;
  onClick: () => void;
  isDisabled: boolean;
}

function ExerciseItem({ exercise, onClick, isDisabled }: ExerciseItemProps) {
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
      onClick={onClick}
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
      <Icon className="exercise-icon" viewBox="0 0 24 24" boxSize="20px" color="neutral.400" aria-hidden="true">
        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      </Icon>
    </Box>
  );
}

export default ExerciseSelectionModal;
