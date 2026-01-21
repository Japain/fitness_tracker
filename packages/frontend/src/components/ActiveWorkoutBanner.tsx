import React from 'react';
import { Box, Flex, Text, Button, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutSessionWithExercises } from '@fitness-tracker/shared';

/**
 * ActiveWorkoutBanner Component
 * Displays active workout information at the top of Exercise Library page
 *
 * Design reference: mockups/EXERCISE-LIBRARY-DESIGN-SPEC.md (Active Workout Banner section)
 * Used in: ExerciseLibraryPage
 *
 * Features:
 * - Green gradient background (matches active workout screen)
 * - Shows workout name and duration
 * - "View Workout" button to navigate to active workout
 * - Only shown when user has an active workout
 */
interface ActiveWorkoutBannerProps {
  workout: WorkoutSessionWithExercises;
}

/**
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate workout duration based on start time
 */
function useWorkoutDuration(startTime: string | Date): number {
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const calculateDuration = () => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const diffInSeconds = Math.floor((now - start) / 1000);
      setDuration(diffInSeconds);
    };

    // Calculate immediately
    calculateDuration();

    // Update every second
    const interval = setInterval(calculateDuration, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return duration;
}

export function ActiveWorkoutBanner({ workout }: ActiveWorkoutBannerProps) {
  const navigate = useNavigate();
  const duration = useWorkoutDuration(workout.startTime);

  const handleViewWorkout = () => {
    navigate(`/workout/${workout.id}`);
  };

  return (
    <Box
      bg="linear-gradient(135deg, var(--chakra-colors-success-500), var(--chakra-colors-success-600))"
      color="white"
      borderRadius="md"
      p="lg"
      mb="lg"
    >
      <Flex justify="space-between" align="center">
        <Box flex="1">
          <Text
            fontSize="xs"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            opacity={0.9}
            mb="xs"
          >
            Active Workout
          </Text>
          <Text fontSize="md" fontWeight="semibold">
            Workout in progress • {formatDuration(duration)}
          </Text>
        </Box>

        <Button
          bg="white"
          color="success.500"
          size="sm"
          h="40px"
          px="lg"
          fontSize="sm"
          fontWeight="semibold"
          borderRadius="md"
          onClick={handleViewWorkout}
          _hover={{
            bg: 'whiteAlpha.900',
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          }}
          _active={{
            bg: 'whiteAlpha.800',
            transform: 'translateY(0)',
          }}
          leftIcon={
            <Icon viewBox="0 0 24 24" boxSize="16px" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
              />
            </Icon>
          }
        >
          View Workout
        </Button>
      </Flex>
    </Box>
  );
}
