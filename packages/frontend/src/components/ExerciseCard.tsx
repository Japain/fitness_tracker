import { useState, useRef } from 'react';
import {
  Box,
  Heading,
  Button,
  HStack,
  VStack,
  Icon,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { WorkoutExerciseWithExercise } from '@fitness-tracker/shared';
import { apiRequest } from '../api/client';
import SetRow from './SetRow';

/**
 * Exercise Card Component
 * Design reference: mockups/html/02-active-workout.html lines 437-473
 *
 * Displays exercise name, category, and sets in table format
 * Includes edit/delete actions and "Add Another Set" button
 */
interface ExerciseCardProps {
  workoutExercise: WorkoutExerciseWithExercise;
  workoutId: string;
  onUpdate: () => void;
}

function ExerciseCard({ workoutExercise, workoutId, onUpdate }: ExerciseCardProps) {
  const toast = useToast();
  const [isAddingSet, setIsAddingSet] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Notes modal state
  const {
    isOpen: isNotesOpen,
    onOpen: onNotesOpen,
    onClose: onNotesClose,
  } = useDisclosure();
  const [notes, setNotes] = useState(workoutExercise.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const { exercise, sets = [] } = workoutExercise;
  const isStrength = exercise.type === 'strength';

  /**
   * Handle "Add Another Set" button click
   * Creates a new set with default values based on exercise type
   */
  const handleAddSet = async () => {
    setIsAddingSet(true);

    try {
      const newSetNumber = sets.length + 1;

      // Default values based on exercise type
      // Note: reps and duration must be positive (>0) per validation schema
      const setData = isStrength
        ? {
            setNumber: newSetNumber,
            reps: 1, // Default to 1 rep (user will update)
            weight: null, // Optional field
            weightUnit: 'lbs' as const,
            completed: false,
          }
        : {
            setNumber: newSetNumber,
            duration: 60, // Default to 60 seconds (1 minute)
            distance: null, // Optional field
            distanceUnit: 'km' as const,
            completed: false,
          };

      await apiRequest(
        `/api/workouts/${workoutId}/exercises/${workoutExercise.id}/sets`,
        {
          method: 'POST',
          body: setData,
        }
      );

      // Refresh workout data
      onUpdate();
    } catch (error) {
      // TODO: Implement centralized error handling pattern
      toast({
        title: 'Failed to add set',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while adding the set. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsAddingSet(false);
    }
  };

  /**
   * Handle delete exercise confirmation
   * Removes the exercise from the workout
   */
  const handleDeleteExercise = async () => {
    onClose();

    try {
      await apiRequest(`/api/workouts/${workoutId}/exercises/${workoutExercise.id}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Exercise removed',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

      // Refresh workout data
      onUpdate();
    } catch (error) {
      toast({
        title: 'Failed to remove exercise',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while removing the exercise. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  /**
   * Handle saving exercise notes
   * Updates the notes field for the workout exercise
   */
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);

    try {
      await apiRequest(`/api/workouts/${workoutId}/exercises/${workoutExercise.id}`, {
        method: 'PATCH',
        body: {
          notes: notes.trim() || null, // Send null for empty notes
        },
      });

      toast({
        title: 'Notes saved',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

      // Close modal
      onNotesClose();

      // Refresh workout data
      onUpdate();
    } catch (error) {
      toast({
        title: 'Failed to save notes',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while saving notes. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  /**
   * Open notes modal and sync state with current notes
   */
  const handleOpenNotesModal = () => {
    setNotes(workoutExercise.notes || '');
    onNotesOpen();
  };

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.200"
      borderRadius="md"
      p="lg"
      boxShadow="sm"
    >
      {/* Exercise Header */}
      <HStack justify="space-between" align="flex-start" mb="md">
        <Heading fontSize="lg" fontWeight="semibold" color="neutral.900">
          {exercise.name}
        </Heading>

        <HStack spacing="xs">
          {/* Edit button */}
          <IconButton
            aria-label="Edit exercise notes"
            icon={
              <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </Icon>
            }
            variant="ghost"
            color="neutral.500"
            size="sm"
            minH="44px"
            minW="44px"
            onClick={handleOpenNotesModal}
            _hover={{
              bg: 'neutral.100',
              color: 'neutral.700',
            }}
          />

          {/* Delete button */}
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
            variant="ghost"
            color="neutral.500"
            size="sm"
            minH="44px"
            minW="44px"
            onClick={onOpen}
            _hover={{
              bg: 'error.50',
              color: 'error.500',
            }}
          />
        </HStack>
      </HStack>

      {/* Sets Table */}
      <VStack spacing="0" align="stretch">
        {sets.map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            workoutId={workoutId}
            workoutExerciseId={workoutExercise.id}
            exerciseType={exercise.type}
            isLastSet={index === sets.length - 1}
            onUpdate={onUpdate}
          />
        ))}
      </VStack>

      {/* Add Another Set Button */}
      <Button
        w="full"
        h="44px"
        bg="neutral.100"
        border="1px dashed"
        borderColor="neutral.300"
        borderRadius="sm"
        color="neutral.700"
        fontSize="sm"
        fontWeight="semibold"
        mt="md"
        onClick={handleAddSet}
        isLoading={isAddingSet}
        loadingText="Adding..."
        _hover={{
          bg: 'neutral.200',
          borderColor: 'neutral.400',
        }}
      >
        + Add Another Set
      </Button>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent mx="lg">
            <AlertDialogHeader fontSize="lg" fontWeight="semibold">
              Remove Exercise
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove <strong>{exercise.name}</strong> from this workout?
              All sets will be deleted.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteExercise} ml="md">
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Exercise Notes Modal */}
      <Modal isOpen={isNotesOpen} onClose={onNotesClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent mx="lg">
          <ModalHeader>
            Exercise Notes
            <Box as="span" fontWeight="normal" fontSize="sm" color="neutral.600" display="block" mt="xs">
              {exercise.name}
            </Box>
          </ModalHeader>

          <ModalBody>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold" color="neutral.700">
                Notes (optional)
              </FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about form, weight progression, how you felt, etc."
                rows={5}
                fontSize="md"
                border="2px solid"
                borderColor="neutral.300"
                borderRadius="md"
                _focus={{
                  borderColor: 'primary.500',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                }}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr="md" onClick={onNotesClose} isDisabled={isSavingNotes}>
              Cancel
            </Button>
            <Button
              colorScheme="primary"
              onClick={handleSaveNotes}
              isLoading={isSavingNotes}
              loadingText="Saving..."
            >
              Save Notes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ExerciseCard;
