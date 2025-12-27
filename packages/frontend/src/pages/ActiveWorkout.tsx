import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  Spinner,
  Center,
  useToast,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import useSWR from 'swr';
import { WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { fetcher, apiRequest } from '../api/client';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseSelectionModal from '../components/ExerciseSelectionModal';

/**
 * Active Workout Page
 * Design reference: mockups/html/02-active-workout.html
 *
 * Features:
 * - Green gradient header with workout timer
 * - List of exercises with set input tables
 * - Fixed bottom actions: Add Exercise + Finish Workout
 * - Real-time timer showing elapsed workout time
 */
function ActiveWorkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [isFinishing, setIsFinishing] = useState(false);

  // Workout notes modal state
  const {
    isOpen: isNotesOpen,
    onOpen: onNotesOpen,
    onClose: onNotesClose,
  } = useDisclosure();
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Cancel workout dialog state
  const {
    isOpen: isCancelOpen,
    onOpen: onCancelOpen,
    onClose: onCancelClose,
  } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // Validate id parameter exists
  if (!id) {
    return (
      <Center h="50vh">
        <VStack spacing="lg">
          <Text color="error.500" fontSize="lg" fontWeight="semibold">
            Workout ID is required
          </Text>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </VStack>
      </Center>
    );
  }

  // Fetch workout details
  const {
    data: workout,
    error,
    mutate,
  } = useSWR<WorkoutSessionWithExercises>(`/api/workouts/${id}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Handle loading and error states
  if (error) {
    return (
      <Center h="50vh">
        <VStack spacing="lg">
          <Text color="error.500" fontSize="lg" fontWeight="semibold">
            Failed to load workout
          </Text>
          <Text color="neutral.600" fontSize="md" textAlign="center" px="lg">
            There was a problem loading your workout. Please try again.
          </Text>
          <HStack spacing="md">
            <Button onClick={() => mutate()} colorScheme="primary">
              Retry
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Dashboard
            </Button>
          </HStack>
        </VStack>
      </Center>
    );
  }

  if (!workout) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="primary.500" thickness="4px" />
      </Center>
    );
  }

  /**
   * Handle "Finish Workout" button click
   * Sets endTime to now and navigates to workout detail view
   */
  const handleFinishWorkout = async () => {
    setIsFinishing(true);

    try {
      await apiRequest(`/api/workouts/${id}`, {
        method: 'PATCH',
        body: {
          endTime: new Date().toISOString(),
        },
      });

      toast({
        title: 'Workout completed!',
        description: 'Great job on your workout.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });

      // Navigate to workout detail view
      navigate(`/history/${id}`);
    } catch (error) {
      // TODO: Implement centralized error handling pattern
      toast({
        title: 'Failed to finish workout',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while finishing the workout. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      setIsFinishing(false);
    }
  };

  /**
   * Handle opening workout notes modal
   * Sync state with current workout notes
   */
  const handleOpenNotesModal = () => {
    setWorkoutNotes(workout?.notes || '');
    onNotesOpen();
  };

  /**
   * Handle saving workout notes
   */
  const handleSaveWorkoutNotes = async () => {
    setIsSavingNotes(true);

    try {
      await apiRequest(`/api/workouts/${id}`, {
        method: 'PATCH',
        body: {
          notes: workoutNotes.trim() || null,
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
      mutate();
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
   * Handle cancel workout confirmation
   * Deletes the workout and navigates to dashboard
   */
  const handleCancelWorkout = async () => {
    onCancelClose();
    setIsCanceling(true);

    try {
      await apiRequest(`/api/workouts/${id}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Workout canceled',
        description: 'Your workout has been deleted.',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });

      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      toast({
        title: 'Failed to cancel workout',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while canceling the workout. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      setIsCanceling(false);
    }
  };

  return (
    <Box pb="100px">
      {/* Workout Header - Green gradient with timer */}
      <WorkoutHeader
        startTime={workout.startTime}
        onBack={() => navigate('/')}
        onOpenNotes={handleOpenNotesModal}
        onCancelWorkout={onCancelOpen}
      />

      {/* Main Content */}
      <Box px="lg" py="xl" maxW="600px" mx="auto" w="full">
        {/* Exercises Section */}
        <VStack align="stretch" spacing="md">
          <Heading
            size="sm"
            fontSize="sm"
            fontWeight="semibold"
            color="neutral.600"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            Exercises ({workout.exercises?.length || 0})
          </Heading>

          {workout.exercises?.length === 0 ? (
            // Empty state
            <Box
              bg="white"
              p="2xl"
              borderRadius="md"
              border="1px solid"
              borderColor="neutral.200"
              textAlign="center"
            >
              <Box
                w="64px"
                h="64px"
                mx="auto"
                mb="lg"
                opacity={0.3}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon viewBox="0 0 24 24" boxSize="64px" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"
                  />
                </Icon>
              </Box>
              <Heading size="sm" color="neutral.900" mb="sm">
                No exercises yet
              </Heading>
              <Text color="neutral.600" mb="xl">
                Add your first exercise to get started!
              </Text>
            </Box>
          ) : (
            // Exercise cards
            workout.exercises.map((workoutExercise) => (
              <ExerciseCard
                key={workoutExercise.id}
                workoutExercise={workoutExercise}
                workoutId={id}
                onUpdate={mutate}
              />
            ))
          )}
        </VStack>
      </Box>

      {/* Fixed Bottom Actions */}
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg="white"
        p="lg"
        borderTop="1px solid"
        borderTopColor="neutral.200"
        boxShadow="0 -2px 8px rgba(0, 0, 0, 0.05)"
        zIndex={1000}
      >
        <HStack spacing="md" maxW="600px" mx="auto">
          <Button
            flex="1"
            h="56px"
            colorScheme="primary"
            fontSize="lg"
            fontWeight="semibold"
            leftIcon={
              <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </Icon>
            }
            onClick={onOpen}
          >
            Add Exercise
          </Button>
          <Button
            flex="1"
            h="56px"
            bg="neutral.100"
            color="neutral.700"
            border="1px solid"
            borderColor="neutral.300"
            fontSize="lg"
            fontWeight="semibold"
            leftIcon={
              <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
              </Icon>
            }
            onClick={handleFinishWorkout}
            isLoading={isFinishing}
            loadingText="Finishing..."
            _hover={{
              bg: 'neutral.200',
            }}
          >
            Finish
          </Button>
        </HStack>
      </Box>

      {/* Exercise Selection Modal */}
      <ExerciseSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        workoutId={id}
        workout={workout}
        onExerciseAdded={mutate}
      />

      {/* Workout Notes Modal */}
      <Modal isOpen={isNotesOpen} onClose={onNotesClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent mx="lg">
          <ModalHeader>Workout Notes</ModalHeader>

          <ModalBody>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold" color="neutral.700">
                Notes (optional)
              </FormLabel>
              <Textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Add notes about this workout session..."
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
              onClick={handleSaveWorkoutNotes}
              isLoading={isSavingNotes}
              loadingText="Saving..."
            >
              Save Notes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Cancel Workout Confirmation Dialog */}
      <AlertDialog
        isOpen={isCancelOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCancelClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent mx="lg">
            <AlertDialogHeader fontSize="lg" fontWeight="semibold">
              Cancel Workout
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to cancel this workout? All exercises and sets will be
              deleted. This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCancelClose} isDisabled={isCanceling}>
                Keep Workout
              </Button>
              <Button
                colorScheme="red"
                onClick={handleCancelWorkout}
                ml="md"
                isLoading={isCanceling}
                loadingText="Canceling..."
              >
                Cancel Workout
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

/**
 * Workout Header Component
 * Green gradient header with timer and back button
 */
interface WorkoutHeaderProps {
  startTime: Date | string;
  onBack: () => void;
  onOpenNotes: () => void;
  onCancelWorkout: () => void;
}

function WorkoutHeader({ startTime, onBack, onOpenNotes, onCancelWorkout }: WorkoutHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState('00:00');

  // Calculate elapsed time and update every second
  useEffect(() => {
    const calculateElapsed = () => {
      const startDate = new Date(startTime);
      const start = startDate.getTime();

      // Validate date is valid
      if (isNaN(start)) {
        console.error('Invalid startTime date:', startTime);
        return '00:00';
      }

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - start) / 1000);

      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    };

    // Initial calculation
    setElapsedTime(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <Box
      bgGradient="linear(135deg, success.500, #059669)"
      color="white"
      p="lg"
      boxShadow="md"
      position="sticky"
      top="0"
      zIndex={100}
    >
      <HStack justify="space-between" align="center" mb="md">
        <Button
          aria-label="Return to dashboard"
          variant="unstyled"
          color="white"
          p="sm"
          minH="44px"
          minW="44px"
          display="flex"
          alignItems="center"
          onClick={onBack}
          _hover={{
            bg: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </Icon>
        </Button>

        <Menu placement="bottom-end">
          <MenuButton
            as={IconButton}
            aria-label="Workout menu"
            icon={
              <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </Icon>
            }
            variant="unstyled"
            color="white"
            minH="44px"
            minW="44px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            _hover={{
              bg: 'rgba(255, 255, 255, 0.1)',
            }}
            _active={{
              bg: 'rgba(255, 255, 255, 0.2)',
            }}
          />
          <MenuList zIndex={1000}>
            <MenuItem
              icon={
                <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                  />
                </Icon>
              }
              onClick={onOpenNotes}
            >
              Add Notes to Workout
            </MenuItem>
            <MenuItem
              icon={
                <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </Icon>
              }
              onClick={onCancelWorkout}
              color="error.500"
            >
              Cancel Workout
            </MenuItem>
            <MenuItem
              icon={
                <Icon viewBox="0 0 24 24" boxSize="20px" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
                  />
                </Icon>
              }
              isDisabled
            >
              Settings (Coming Soon)
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      <Heading size="md" mb="xs">
        Workout Session
      </Heading>

      <HStack spacing="sm" fontSize="lg" fontWeight="semibold">
        <Box
          w="10px"
          h="10px"
          bg="white"
          borderRadius="full"
          sx={{
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <Text>{elapsedTime}</Text>
      </HStack>
    </Box>
  );
}

export default ActiveWorkout;
