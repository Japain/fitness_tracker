import { useState, useMemo } from 'react';
import { Box, Flex, Heading, Button, Icon, VStack, Text, useToast, useDisclosure } from '@chakra-ui/react';
import { ExerciseSearchBar } from '../../components/ExerciseSearchBar';
import { CategoryFilter } from '../../components/CategoryFilter';
import { TypeFilter } from '../../components/TypeFilter';
import { ResultsHeader } from '../../components/ResultsHeader';
import { ExerciseListItem } from '../../components/ExerciseListItem';
import { ActiveWorkoutBanner } from '../../components/ActiveWorkoutBanner';
import { CreateExerciseModal } from '../../components/CreateExerciseModal';
import { EditExerciseModal } from '../../components/EditExerciseModal';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import type { CustomExerciseFormValues } from '../../components/CustomExerciseForm';
import { useExercises } from '../../hooks/useExercises';
import { useActiveWorkout } from '../../hooks/useActiveWorkout';
import { filterExercises } from '../../utils/filterExercises';
import { sortExercises, ExerciseSortBy } from '../../utils/sortExercises';
import { handleError } from '../../utils/errorHandling';
import { apiRequest } from '../../api/client';
import type { WorkoutExercise, Exercise } from '@fitness-tracker/shared';

/**
 * ExerciseLibraryPage Component
 * Design reference: mockups/html/07-exercise-library.html
 * Design spec: mockups/EXERCISE-LIBRARY-DESIGN-SPEC.md
 *
 * Features:
 * - Browse and manage exercise library (60 library + custom exercises)
 * - Multi-faceted filtering (search, category, type)
 * - Sorting options (name, recent, category)
 * - Add exercises to active workout
 * - Create, edit, delete custom exercises
 * - Active workout banner for quick context
 *
 * Mobile-first responsive design with WCAG AA accessibility compliance
 */
export default function ExerciseLibraryPage() {
  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<'all' | 'strength' | 'cardio'>('all');
  const [sortBy, setSortBy] = useState<ExerciseSortBy>('name');

  // Loading state for add to workout action
  const [addingExerciseId, setAddingExerciseId] = useState<string | null>(null);

  // Modal state
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const toast = useToast();

  // Data fetching
  const { exercises, isLoading, error, refetch: refetchExercises } = useExercises();
  const { activeWorkout, refetch: refetchActiveWorkout } = useActiveWorkout();

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedType('all');
  };

  // Client-side filtering and sorting
  const filteredAndSortedExercises = useMemo(() => {
    if (!exercises) return [];

    const filtered = filterExercises(exercises, {
      search: searchQuery,
      category: selectedCategory,
      type: selectedType,
    });

    return sortExercises(filtered, sortBy);
  }, [exercises, searchQuery, selectedCategory, selectedType, sortBy]);

  /**
   * Handle adding an exercise to the active workout
   */
  const handleAddToWorkout = async (exercise: Exercise) => {
    if (!activeWorkout) {
      toast({
        title: 'No active workout',
        description: 'Start a workout to add exercises',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setAddingExerciseId(exercise.id);

    try {
      // Calculate the next order index (last exercise index + 1)
      const orderIndex = activeWorkout?.exercises?.length ?? 0;

      // Add exercise to workout via API
      await apiRequest<WorkoutExercise>(`/api/workouts/${activeWorkout.id}/exercises`, {
        method: 'POST',
        body: {
          exerciseId: exercise.id,
          orderIndex,
        },
      });

      // Refresh active workout to show the new exercise
      await refetchActiveWorkout();

      // Show success toast
      toast({
        title: 'Exercise added',
        description: `${exercise.name} added to workout`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      handleError(err, {
        title: 'Failed to add exercise',
        consolePrefix: 'Failed to add exercise to workout:',
      }, toast);
    } finally {
      setAddingExerciseId(null);
    }
  };

  /**
   * Handle creating a new custom exercise
   */
  const handleCreateExercise = async (values: CustomExerciseFormValues) => {
    setIsSubmitting(true);

    try {
      await apiRequest<Exercise>('/api/exercises', {
        method: 'POST',
        body: values,
      });

      // Refresh exercise list
      await refetchExercises();

      toast({
        title: 'Exercise created',
        description: `${values.name} added to your library`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      handleError(err, {
        title: 'Failed to create exercise',
        consolePrefix: 'Failed to create exercise:',
        rethrow: true,
      }, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle editing a custom exercise
   */
  const handleEditExercise = async (exerciseId: string, values: CustomExerciseFormValues) => {
    setIsSubmitting(true);

    try {
      await apiRequest<Exercise>(`/api/exercises/${exerciseId}`, {
        method: 'PATCH',
        body: values,
      });

      // Refresh exercise list
      await refetchExercises();

      toast({
        title: 'Exercise updated',
        description: `${values.name} has been updated`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      handleError(err, {
        title: 'Failed to update exercise',
        consolePrefix: 'Failed to update exercise:',
        rethrow: true,
      }, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle deleting a custom exercise
   */
  const handleDeleteExercise = async (exerciseId: string) => {
    setIsSubmitting(true);

    try {
      await apiRequest(`/api/exercises/${exerciseId}`, {
        method: 'DELETE',
      });

      // Refresh exercise list
      await refetchExercises();

      toast({
        title: 'Exercise deleted',
        description: 'Exercise removed from your library',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      handleError(err, {
        title: 'Failed to delete exercise',
        consolePrefix: 'Failed to delete exercise:',
        rethrow: true,
      }, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Open edit modal for a specific exercise
   */
  const handleOpenEdit = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    onEditOpen();
  };

  /**
   * Open delete modal for a specific exercise
   */
  const handleOpenDelete = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    onDeleteOpen();
  };

  return (
    <Box as="main" bg="neutral.50" minH="100vh" pb="120px">
      {/* Custom Top Navigation for Exercise Library */}
      <Box
        as="header"
        bg="white"
        borderBottom="1px"
        borderColor="neutral.200"
        px="lg"
        py="lg"
        boxShadow="sm"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Flex justify="space-between" align="center">
          <Heading size="h1" fontSize="2xl" fontWeight="bold" color="neutral.900">
            Exercises
          </Heading>

          <Button
            colorScheme="primary"
            size="md"
            h="44px"
            leftIcon={
              <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </Icon>
            }
            onClick={onCreateOpen}
          >
            Create
          </Button>
        </Flex>
      </Box>

      {/* Main Content Container */}
      <VStack spacing="lg" align="stretch" px="lg" py="lg">
        {/* Active Workout Banner - conditionally shown */}
        {activeWorkout && <ActiveWorkoutBanner workout={activeWorkout} />}

        {/* Search Bar */}
        <ExerciseSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search exercises..."
        />

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showLabel={true}
          showClearAll={true}
        />

        {/* Type Filter */}
        <TypeFilter selectedType={selectedType} onTypeChange={setSelectedType} />

        {/* Results Header (count + sort) */}
        {!isLoading && !error && (
          <ResultsHeader
            count={filteredAndSortedExercises.length}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {/* Exercise List */}
        {isLoading && (
          <Text color="neutral.600" textAlign="center" py="xl">
            Loading exercises...
          </Text>
        )}

        {error && (
          <Text color="error.500" textAlign="center" py="xl">
            Failed to load exercises. Please try again.
          </Text>
        )}

        {!isLoading && !error && filteredAndSortedExercises.length === 0 && (
          <Box bg="white" border="1px solid" borderColor="neutral.200" borderRadius="md" p="xl" textAlign="center">
            <Icon viewBox="0 0 24 24" boxSize="24px" color="neutral.400" aria-hidden="true">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </Icon>
            <Text fontSize="sm" fontWeight="semibold" color="neutral.700" mt="sm">No exercises found</Text>
            <Text fontSize="xs" color="neutral.500" mt="xs">
              Try a different search or{' '}
              <Button variant="link" size="sm" colorScheme="primary" onClick={handleClearFilters}>
                clear filters
              </Button>
            </Text>
          </Box>
        )}

        {!isLoading && !error && filteredAndSortedExercises.length > 0 && (
          <VStack spacing="md" align="stretch">
            {filteredAndSortedExercises.map((exercise) => (
              <ExerciseListItem
                key={exercise.id}
                exercise={exercise}
                variant="actionable"
                showBadges={true}
                onAddToWorkout={() => handleAddToWorkout(exercise)}
                onEdit={exercise.isCustom ? () => handleOpenEdit(exercise) : undefined}
                onDelete={exercise.isCustom ? () => handleOpenDelete(exercise) : undefined}
                isLoading={addingExerciseId === exercise.id}
              />
            ))}
          </VStack>
        )}
      </VStack>

      {/* Modals */}
      <CreateExerciseModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSubmit={handleCreateExercise}
        isLoading={isSubmitting}
      />

      <EditExerciseModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        exercise={selectedExercise}
        onSubmit={handleEditExercise}
        isLoading={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        exercise={selectedExercise}
        onConfirm={handleDeleteExercise}
        isLoading={isSubmitting}
      />
    </Box>
  );
}
