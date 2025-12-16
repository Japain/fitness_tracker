import { useState, useEffect } from 'react';
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
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
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

      // Show success toast
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
      toast({
        title: 'Failed to finish workout',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      setIsFinishing(false);
    }
  };

  return (
    <Box pb="100px">
      {/* Workout Header - Green gradient with timer */}
      <WorkoutHeader startTime={workout.startTime} onBack={() => navigate('/')} />

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
                <Icon viewBox="0 0 24 24" boxSize="64px">
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
                workoutId={id!}
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
        zIndex={10}
      >
        <HStack spacing="md" maxW="600px" mx="auto">
          <Button
            flex="1"
            h="56px"
            colorScheme="primary"
            fontSize="lg"
            fontWeight="semibold"
            leftIcon={
              <Icon viewBox="0 0 24 24" boxSize="20px">
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
              <Icon viewBox="0 0 24 24" boxSize="20px">
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
        workoutId={id!}
        onExerciseAdded={mutate}
      />
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
}

function WorkoutHeader({ startTime, onBack }: WorkoutHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState('00:00');

  // Calculate elapsed time and update every second
  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime();
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
          <Icon viewBox="0 0 24 24" boxSize="20px">
            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </Icon>
        </Button>

        <Button
          aria-label="Workout menu"
          variant="unstyled"
          color="white"
          p="sm"
          minH="44px"
          minW="44px"
          display="flex"
          alignItems="center"
          onClick={() => {
            // TODO: Implement menu with options: Add notes, Cancel workout, Settings
            alert('Menu functionality coming soon:\n- Add notes to workout\n- Cancel workout\n- Settings');
          }}
          _hover={{
            bg: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <Icon viewBox="0 0 24 24" boxSize="20px">
            <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </Icon>
        </Button>
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
