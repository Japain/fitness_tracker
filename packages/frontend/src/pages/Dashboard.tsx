import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  Grid,
  VStack,
  HStack,
  Icon,
  Skeleton,
  SkeletonText,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { useAuthStore } from '../stores/authStore';
import { useRecentWorkouts, useWeeklyStats } from '../hooks/useWorkouts';
import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { apiRequest, ApiError } from '../api/client';

/**
 * Dashboard/Home Page
 * Design reference: mockups/html/01-dashboard-home.html
 *
 * Features:
 * - Welcome message with user's displayName
 * - "Start New Workout" button (handles active workout conflict)
 * - Weekly stats (4 cards: workouts, time, exercises, volume)
 * - Recent workouts (last 3 workouts)
 * - "View All" link to history page
 */
function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const { workouts: recentWorkouts, isLoading: workoutsLoading } = useRecentWorkouts(3);
  const { activeWorkout } = useActiveWorkout();
  const { stats, isLoading: statsLoading } = useWeeklyStats();

  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const { isOpen: isConflictModalOpen, onOpen: openConflictModal, onClose: closeConflictModal } = useDisclosure();

  // Memoized formatted values to avoid recalculating on every render
  const formattedDuration = useMemo(() => `${stats.totalDuration.toFixed(1)}h`, [stats.totalDuration]);
  const formattedVolume = useMemo(() => `${(stats.totalVolume / 1000).toFixed(1)}k`, [stats.totalVolume]);

  /**
   * Handle "Start New Workout" button click
   * Creates new workout or shows conflict modal if active workout exists
   */
  const handleStartWorkout = async () => {
    setIsCreatingWorkout(true);

    try {
      const response = await apiRequest<{ id: string; startTime: string }>('/api/workouts', {
        method: 'POST',
        body: {
          startTime: new Date().toISOString(),
        },
      });

      // Success: navigate to new workout
      navigate(`/workout/${response.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Conflict: active workout already exists
        openConflictModal();
      } else {
        // Other error
        toast({
          title: 'Failed to start workout',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
      }
    } finally {
      setIsCreatingWorkout(false);
    }
  };

  /**
   * Handle "Resume" button in conflict modal
   * Navigates to existing active workout
   */
  const handleResumeWorkout = () => {
    closeConflictModal();
    if (activeWorkout) {
      navigate(`/workout/${activeWorkout.id}`);
    }
  };

  /**
   * Format workout date for display
   * Shows "Today", "Yesterday", or formatted date
   */
  const formatWorkoutDate = (startTime: Date | string): string => {
    const date = new Date(startTime);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (isSameDay(date, yesterday)) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  /**
   * Calculate workout duration in minutes
   */
  const calculateDuration = (startTime: Date | string, endTime?: Date | string | null): string => {
    if (!endTime) return 'In progress';

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMinutes = Math.round((end - start) / (1000 * 60));

    return `${durationMinutes} min`;
  };

  return (
    <Box p="xl" maxW="600px" mx="auto" w="full">
      {/* Welcome Section */}
      <VStack align="stretch" spacing="xs" mb="2xl">
        <Heading size="lg" color="neutral.900">
          Welcome back, {user?.displayName?.split(' ')[0] || 'there'}!
        </Heading>
        <Text fontSize="md" color="neutral.600">
          Ready to crush your workout?
        </Text>
      </VStack>

      {/* In-Progress Workout Banner - shown when activeWorkout exists */}
      {activeWorkout && (
        <InProgressBanner
          startTime={activeWorkout.startTime}
          onResume={() => navigate(`/workout/${activeWorkout.id}`)}
        />
      )}

      {/* Primary CTA - Start New Workout */}
      <Button
        w="full"
        h="56px"
        colorScheme="primary"
        fontSize="lg"
        fontWeight="semibold"
        boxShadow="md"
        mb="2xl"
        leftIcon={
          <Icon viewBox="0 0 24 24" boxSize="24px" aria-hidden="true">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </Icon>
        }
        onClick={handleStartWorkout}
        isLoading={isCreatingWorkout}
        loadingText="Starting..."
        _hover={{
          bg: 'primary.600',
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        }}
        _active={{
          bg: 'primary.700',
          transform: 'translateY(0)',
        }}
      >
        Start New Workout
      </Button>

      {/* This Week Stats Section */}
      <Box mb="2xl">
        <Heading size="sm" mb="lg" color="neutral.900">
          This Week
        </Heading>
        <Grid templateColumns="repeat(2, 1fr)" gap="md">
          <StatCard
            value={stats.totalWorkouts}
            label="Workouts"
            isLoading={statsLoading}
          />
          <StatCard
            value={formattedDuration}
            label="Total Time"
            isLoading={statsLoading}
          />
          <StatCard
            value={stats.totalExercises}
            label="Exercises"
            isLoading={statsLoading}
          />
          <StatCard
            value={formattedVolume}
            label="Total Weight (lbs)"
            isLoading={statsLoading}
          />
        </Grid>
      </Box>

      {/* Recent Workouts Section */}
      <Box mb="2xl">
        <Heading size="sm" mb="lg" color="neutral.900">
          Recent Workouts
        </Heading>

        {workoutsLoading ? (
          <VStack spacing="md" align="stretch">
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                bg="white"
                p="lg"
                borderRadius="md"
                border="1px solid"
                borderColor="neutral.200"
                boxShadow="sm"
              >
                <SkeletonText noOfLines={2} spacing="4" />
              </Box>
            ))}
          </VStack>
        ) : recentWorkouts.length === 0 ? (
          <Box
            bg="white"
            p="xl"
            borderRadius="md"
            border="1px solid"
            borderColor="neutral.200"
            textAlign="center"
          >
            <Text color="neutral.600">No workouts yet. Start your first workout!</Text>
          </Box>
        ) : (
          <VStack spacing="md" align="stretch">
            {recentWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                formatDate={formatWorkoutDate}
                calculateDuration={calculateDuration}
                onClick={() => navigate(`/history/${workout.id}`)}
              />
            ))}
          </VStack>
        )}

        {/* View All Link */}
        {recentWorkouts.length > 0 && (
          <Box textAlign="center" mt="lg">
            <Button
              variant="link"
              colorScheme="primary"
              fontSize="md"
              fontWeight="semibold"
              minH="48px"
              onClick={() => navigate('/history')}
              rightIcon={
                <Icon viewBox="0 0 24 24" boxSize="16px" aria-hidden="true">
                  <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </Icon>
              }
            >
              View All Workouts
            </Button>
          </Box>
        )}
      </Box>

      {/* Active Workout Conflict Modal */}
      <Modal isOpen={isConflictModalOpen} onClose={closeConflictModal} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent mx="lg" borderRadius="md">
          <ModalHeader color="neutral.900">Active Workout Detected</ModalHeader>
          <ModalBody>
            <Text color="neutral.700">
              You have an active workout in progress. Would you like to resume it?
            </Text>
          </ModalBody>
          <ModalFooter gap="md">
            <Button variant="outline" onClick={closeConflictModal}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleResumeWorkout}>
              Resume Workout
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

/**
 * Stat Card Component
 * Displays a single statistic with value and label
 */
interface StatCardProps {
  value: string | number;
  label: string;
  isLoading: boolean;
}

function StatCard({ value, label, isLoading }: StatCardProps) {
  return (
    <Box
      bg="white"
      p="lg"
      borderRadius="md"
      border="1px solid"
      borderColor="neutral.200"
      boxShadow="sm"
    >
      {isLoading ? (
        <>
          <Skeleton height="32px" width="60px" mb="xs" />
          <Skeleton height="16px" width="80px" />
        </>
      ) : (
        <>
          <Text fontSize="3xl" fontWeight="bold" color="primary.500" lineHeight="tight" mb="xs">
            {value}
          </Text>
          <Text fontSize="sm" color="neutral.600">
            {label}
          </Text>
        </>
      )}
    </Box>
  );
}

/**
 * In-Progress Workout Banner Component
 * Design reference: mockups/html/01-dashboard-home.html lines 424-434
 * Shows when user has an active workout session
 */
interface InProgressBannerProps {
  startTime: Date | string;
  onResume: () => void;
}

function InProgressBanner({ startTime, onResume }: InProgressBannerProps) {
  // Calculate elapsed time since workout start
  const calculateElapsedTime = (start: Date | string): string => {
    const startDate = new Date(start).getTime();
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - startDate) / (1000 * 60));

    if (elapsedMinutes < 60) {
      return `${elapsedMinutes} minutes ago`;
    } else {
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      return `${hours}h ${minutes}m ago`;
    }
  };

  return (
    <Box
      bgGradient="linear(135deg, success.500, #059669)"
      color="white"
      p="lg"
      borderRadius="md"
      mb="2xl"
      boxShadow="md"
    >
      <HStack spacing="sm" mb="xs">
        <Box
          w="8px"
          h="8px"
          bg="white"
          borderRadius="full"
          sx={{
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <Text fontSize="lg" fontWeight="semibold">
          Workout in progress
        </Text>
      </HStack>
      <Text fontSize="sm" mb="md" opacity={0.9}>
        Started {calculateElapsedTime(startTime)}
      </Text>
      <Button
        w="full"
        h="48px"
        bg="white"
        color="success.500"
        fontSize="md"
        fontWeight="semibold"
        onClick={onResume}
        _hover={{
          bg: 'whiteAlpha.900',
        }}
        _active={{
          bg: 'whiteAlpha.800',
        }}
      >
        Resume Workout
      </Button>
    </Box>
  );
}

/**
 * Workout Card Component
 * Displays a workout summary with date, duration, and exercises
 * Design reference: mockups/html/01-dashboard-home.html lines 471-499
 */
interface WorkoutCardProps {
  workout: {
    id: string;
    startTime: Date | string;
    endTime?: Date | string | null;
    exercises?: Array<{
      exercise: {
        name: string;
      };
    }>;
  };
  formatDate: (date: Date | string) => string;
  calculateDuration: (start: Date | string, end?: Date | string | null) => string;
  onClick: () => void;
}

function WorkoutCard({ workout, formatDate, calculateDuration, onClick }: WorkoutCardProps) {
  // Format exercise list: "Exercise1, Exercise2, Exercise3 +N more"
  const formatExercises = (): string => {
    const exercises = workout.exercises || [];
    if (exercises.length === 0) return 'No exercises logged';

    const exerciseNames = exercises.map((we) => we.exercise.name);

    if (exerciseNames.length <= 3) {
      return exerciseNames.join(', ');
    } else {
      const firstThree = exerciseNames.slice(0, 3).join(', ');
      const remaining = exerciseNames.length - 3;
      return `${firstThree} +${remaining} more`;
    }
  };

  return (
    <Box
      bg="white"
      p="lg"
      borderRadius="md"
      border="1px solid"
      borderColor="neutral.200"
      boxShadow="sm"
      cursor="pointer"
      transition="all 150ms ease-in-out"
      _hover={{
        borderColor: 'primary.500',
        boxShadow: 'md',
      }}
      onClick={onClick}
    >
      <HStack justify="space-between" align="flex-start" mb="md">
        <Text fontSize="lg" fontWeight="semibold" color="neutral.900">
          {formatDate(workout.startTime)}
        </Text>
        <Box
          px="md"
          py="xs"
          bg="neutral.100"
          borderRadius="sm"
          fontSize="sm"
          color="neutral.600"
        >
          {calculateDuration(workout.startTime, workout.endTime)}
        </Box>
      </HStack>
      <Text fontSize="sm" color="neutral.600">
        {formatExercises()}
      </Text>
    </Box>
  );
}

export default Dashboard;
