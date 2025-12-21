import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Icon,
  Skeleton,
  SkeletonText,
  Button,
  Flex,
} from '@chakra-ui/react';
import type { WorkoutSessionWithExercises } from '@fitness-tracker/shared';
import { useWorkoutHistory, useMonthlyStats } from '../hooks/useWorkoutHistory';
import { formatWorkoutDate, calculateDuration, formatDurationHours } from '../utils/dateFormatting';

/**
 * Workout History Page
 * Design reference: mockups/html/04-workout-history.html
 *
 * Features:
 * - Monthly stats summary (3 cards: workouts, total time, exercises)
 * - Chronological workout list in reverse order (most recent first)
 * - Pagination (20 workouts per page)
 * - Each workout card shows: date, duration, exercise count, exercise pills
 * - Clickable cards navigate to workout detail
 */
function WorkoutHistory() {
  const navigate = useNavigate();
  const {
    workouts,
    pagination,
    isLoading,
    error,
    nextPage,
    previousPage,
    currentPage,
    totalPages,
  } = useWorkoutHistory(20);
  const { stats, isLoading: statsLoading } = useMonthlyStats();

  return (
    <Box p="xl" maxW="600px" mx="auto" w="full">
      {/* Stats Summary Card */}
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap="lg"
        bg="white"
        p="lg"
        borderRadius="md"
        border="1px solid"
        borderColor="neutral.200"
        boxShadow="sm"
        mb="xl"
      >
        <StatItem
          value={stats.totalWorkouts}
          label="This Month"
          isLoading={statsLoading}
        />
        <StatItem
          value={formatDurationHours(stats.totalDuration)}
          label="Total Time"
          isLoading={statsLoading}
        />
        <StatItem
          value={stats.totalExercises}
          label="Exercises"
          isLoading={statsLoading}
        />
      </Grid>

      {/* Section Title */}
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="neutral.600"
        textTransform="uppercase"
        letterSpacing="0.5px"
        mb="lg"
      >
        All Workouts
      </Text>

      {/* Error State */}
      {error && (
        <Box
          bg="error.50"
          color="error.500"
          p="lg"
          borderRadius="md"
          textAlign="center"
        >
          <Text fontWeight="semibold" mb="xs">
            Failed to load workouts
          </Text>
          <Text fontSize="sm">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </Text>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
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
              <SkeletonText noOfLines={3} spacing="4" />
            </Box>
          ))}
        </VStack>
      )}

      {/* Empty State */}
      {!isLoading && !error && workouts.length === 0 && (
        <Box
          bg="white"
          p="xl"
          borderRadius="md"
          border="1px solid"
          borderColor="neutral.200"
          textAlign="center"
        >
          <Text color="neutral.600" fontSize="lg" mb="md">
            No workouts yet
          </Text>
          <Text color="neutral.500" fontSize="sm" mb="lg">
            Start your first workout to see your history here!
          </Text>
          <Button
            colorScheme="primary"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
        </Box>
      )}

      {/* Workout List */}
      {!isLoading && !error && workouts.length > 0 && (
        <>
          <VStack spacing="md" align="stretch" mb="xl">
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onClick={() => navigate(`/history/${workout.id}`)}
              />
            ))}
          </VStack>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Flex justify="center" align="center" gap="md">
              <Button
                variant="outline"
                onClick={previousPage}
                isDisabled={currentPage === 1}
                minH="44px"
                minW="44px"
              >
                Previous
              </Button>
              <Text fontSize="sm" color="neutral.600">
                Page {currentPage} of {totalPages}
              </Text>
              <Button
                variant="outline"
                onClick={nextPage}
                isDisabled={!pagination.hasMore}
                minH="44px"
                minW="44px"
              >
                Next
              </Button>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
}

/**
 * Stat Item Component
 * Displays a single statistic with value and label
 * Design reference: mockups/html/04-workout-history.html lines 205-218
 */
interface StatItemProps {
  value: string | number;
  label: string;
  isLoading: boolean;
}

function StatItem({ value, label, isLoading }: StatItemProps) {
  return (
    <Box textAlign="center">
      {isLoading ? (
        <>
          <Skeleton height="28px" width="40px" mx="auto" mb="xs" />
          <Skeleton height="16px" width="60px" mx="auto" />
        </>
      ) : (
        <>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="primary.500"
            lineHeight="tight"
            mb="xs"
          >
            {value}
          </Text>
          <Text fontSize="xs" color="neutral.600">
            {label}
          </Text>
        </>
      )}
    </Box>
  );
}

/**
 * Workout Card Component
 * Displays a workout summary with date, duration, exercise count, and exercise pills
 * Design reference: mockups/html/04-workout-history.html lines 222-244
 */
interface WorkoutCardProps {
  workout: WorkoutSessionWithExercises;
  onClick: () => void;
}

function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const exerciseCount = workout.exercises?.length || 0;
  const exerciseNames = workout.exercises?.map((we) => we.exercise.name) || [];

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
      {/* Workout Date */}
      <Text
        fontSize="lg"
        fontWeight="semibold"
        color="neutral.900"
        mb="xs"
      >
        {formatWorkoutDate(workout.startTime)}
      </Text>

      {/* Workout Meta (Duration and Exercise Count) */}
      <HStack spacing="lg" mb="md" fontSize="sm" color="neutral.600">
        <HStack spacing="xs">
          <Icon viewBox="0 0 24 24" boxSize="16px" aria-hidden="true">
            <path
              fill="currentColor"
              d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
            />
          </Icon>
          <Text>{calculateDuration(workout.startTime, workout.endTime)}</Text>
        </HStack>

        <HStack spacing="xs">
          <Icon viewBox="0 0 24 24" boxSize="16px" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"
            />
          </Icon>
          <Text>
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
          </Text>
        </HStack>
      </HStack>

      {/* Exercise Pills */}
      {exerciseNames.length > 0 && (
        <Flex flexWrap="wrap" gap="xs" fontSize="sm" color="neutral.700">
          {exerciseNames.slice(0, 3).map((name, index) => (
            <Box
              key={index}
              display="inline-block"
              px="md"
              py="xs"
              bg="neutral.100"
              borderRadius="full"
            >
              {name}
            </Box>
          ))}
          {exerciseNames.length > 3 && (
            <Box
              display="inline-block"
              px="md"
              py="xs"
              bg="neutral.100"
              borderRadius="full"
            >
              +{exerciseNames.length - 3} more
            </Box>
          )}
        </Flex>
      )}
    </Box>
  );
}

export default WorkoutHistory;
