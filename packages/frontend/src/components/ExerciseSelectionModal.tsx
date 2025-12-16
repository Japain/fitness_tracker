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
} from '@chakra-ui/react';
import { Exercise, WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { useExercises } from '../hooks/useExercises';
import { apiRequest } from '../api/client';

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
  workoutId: string;
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
  const { exercises, isLoading } = useExercises();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recentExerciseIds, setRecentExerciseIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Load recent exercises from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_EXERCISES_KEY);
      if (stored) {
        setRecentExerciseIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent exercises:', error);
    }
  }, [isOpen]);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent
        borderRadius="md md 0 0"
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
              <Icon viewBox="0 0 24 24" boxSize="24px">
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
                <Icon viewBox="0 0 24 24" boxSize="20px" color="neutral.500">
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

          {/* Create Custom Exercise Button (future feature) */}
          <Box p="lg" borderTop="1px solid" borderTopColor="neutral.200">
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
                <Icon viewBox="0 0 24 24" boxSize="20px">
                  <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </Icon>
              }
              isDisabled
              _hover={{
                bg: 'neutral.200',
                borderColor: 'neutral.500',
              }}
            >
              Create Custom Exercise (Coming Soon)
            </Button>
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
      <Icon className="exercise-icon" viewBox="0 0 24 24" boxSize="20px" color="neutral.400">
        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      </Icon>
    </Box>
  );
}

export default ExerciseSelectionModal;
