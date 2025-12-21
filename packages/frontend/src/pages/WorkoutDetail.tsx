import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  Grid,
  Button,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import type { WorkoutExerciseWithExercise, WorkoutSet } from '@fitness-tracker/shared';
import { useWorkoutDetail } from '../hooks/useWorkoutDetail';
import { formatWorkoutDate, calculateDuration } from '../utils/dateFormatting';

/**
 * Workout Detail Page
 * Design reference: mockups/html/05-workout-detail.html
 *
 * Features:
 * - Back button to return to history
 * - Menu button for future actions (duplicate, edit, delete)
 * - Workout header card with date and stats (duration, exercises, sets)
 * - Exercise cards with sets displayed in table format
 * - Read-only view of completed workout
 */
function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workout, isLoading, error } = useWorkoutDetail(id);

  // Calculate total sets across all exercises
  const totalSets = workout?.exercises?.reduce((total, exercise) => {
    return total + (exercise.sets?.length || 0);
  }, 0) || 0;

  return (
    <Box p="xl" maxW="600px" mx="auto" w="full">
        {/* Back Button */}
        <Button
          variant="ghost"
          leftIcon={<ChevronLeftIcon boxSize={5} />}
          onClick={() => navigate('/history')}
          color="primary.500"
          fontWeight="semibold"
          mb="lg"
          minH="44px"
          px="sm"
          _hover={{ bg: 'transparent', color: 'primary.600' }}
          _active={{ bg: 'transparent', color: 'primary.700' }}
        >
          Back
        </Button>

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
              Failed to load workout
            </Text>
            <Text fontSize="sm" mb="lg">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </Text>
            <Button variant="outline" onClick={() => navigate('/history')}>
              Back to History
            </Button>
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <>
            <Box
              bg="white"
              p="xl"
              borderRadius="md"
              border="1px solid"
              borderColor="neutral.200"
              boxShadow="sm"
              mb="xl"
            >
              <Skeleton height="36px" width="200px" mb="lg" />
              <SkeletonText noOfLines={1} spacing="4" />
            </Box>

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
                  <SkeletonText noOfLines={4} spacing="4" />
                </Box>
              ))}
            </VStack>
          </>
        )}

        {/* Workout Content */}
        {!isLoading && !error && workout && (
          <>
            {/* Workout Header Card */}
            <Box
              bg="white"
              p="xl"
              borderRadius="md"
              border="1px solid"
              borderColor="neutral.200"
              boxShadow="sm"
              mb="xl"
            >
              <Heading size="lg" mb="lg" color="neutral.900">
                {formatWorkoutDate(workout.startTime)}
              </Heading>

              {/* Stats Grid */}
              <Grid
                templateColumns="repeat(3, 1fr)"
                gap="lg"
                pt="lg"
                borderTop="1px solid"
                borderColor="neutral.200"
              >
                <StatItem
                  value={calculateDuration(workout.startTime, workout.endTime).replace(' min', '')}
                  label="Minutes"
                />
                <StatItem
                  value={workout.exercises?.length || 0}
                  label="Exercises"
                />
                <StatItem
                  value={totalSets}
                  label="Sets"
                />
              </Grid>
            </Box>

            {/* Section Title */}
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="neutral.600"
              textTransform="uppercase"
              letterSpacing="0.5px"
              mb="lg"
            >
              Exercises
            </Text>

            {/* Exercise Cards */}
            {workout.exercises && workout.exercises.length > 0 ? (
              <VStack spacing="md" align="stretch">
                {workout.exercises.map((workoutExercise) => (
                  <ExerciseCard
                    key={workoutExercise.id}
                    workoutExercise={workoutExercise}
                  />
                ))}
              </VStack>
            ) : (
              <Box
                bg="white"
                p="xl"
                borderRadius="md"
                border="1px solid"
                borderColor="neutral.200"
                textAlign="center"
              >
                <Text color="neutral.600">No exercises logged in this workout</Text>
              </Box>
            )}
          </>
        )}
      </Box>
  );
}

/**
 * Stat Item Component
 * Displays a single statistic with value and label
 * Design reference: mockups/html/05-workout-detail.html lines 196-209
 */
interface StatItemProps {
  value: string | number;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <Box textAlign="center">
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
    </Box>
  );
}

/**
 * Exercise Card Component
 * Displays an exercise with all its sets in table format
 * Design reference: mockups/html/05-workout-detail.html lines 214-230
 */
interface ExerciseCardProps {
  workoutExercise: WorkoutExerciseWithExercise;
}

function ExerciseCard({ workoutExercise }: ExerciseCardProps) {
  const sets = workoutExercise.sets || [];
  const isStrengthExercise = workoutExercise.exercise.type === 'strength';

  return (
    <Box
      bg="white"
      p="lg"
      borderRadius="md"
      border="1px solid"
      borderColor="neutral.200"
      boxShadow="sm"
    >
      {/* Exercise Name */}
      <Heading size="sm" mb="md" color="neutral.900">
        {workoutExercise.exercise.name}
      </Heading>

      {/* Sets Table */}
      {sets.length > 0 ? (
        <SetsTable sets={sets} isStrengthExercise={isStrengthExercise} />
      ) : (
        <Text fontSize="sm" color="neutral.500">
          No sets logged
        </Text>
      )}
    </Box>
  );
}

/**
 * Sets Table Component
 * Displays sets in a table format with appropriate columns
 * Design reference: mockups/html/05-workout-detail.html lines 216-229
 */
interface SetsTableProps {
  sets: WorkoutSet[];
  isStrengthExercise: boolean;
}

function SetsTable({ sets, isStrengthExercise }: SetsTableProps) {
  return (
    <Box>
      {/* Table Header */}
      <Grid
        templateColumns={isStrengthExercise ? '40px 1fr 1fr 1fr' : '40px 1fr 1fr'}
        gap="md"
        pb="sm"
        borderBottom="1px solid"
        borderColor="neutral.200"
        mb="sm"
      >
        <Text fontSize="xs" fontWeight="semibold" color="neutral.600" textAlign="center">
          Set
        </Text>
        {isStrengthExercise ? (
          <>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.600" textAlign="center">
              Weight
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.600" textAlign="center">
              Reps
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.600" textAlign="center">
              Status
            </Text>
          </>
        ) : (
          <>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.600" textAlign="center">
              Duration
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.600" textAlign="center">
              Distance
            </Text>
          </>
        )}
      </Grid>

      {/* Table Rows */}
      {sets.map((set) => (
        <Grid
          key={set.id}
          templateColumns={isStrengthExercise ? '40px 1fr 1fr 1fr' : '40px 1fr 1fr'}
          gap="md"
          py="sm"
          fontSize="sm"
        >
          <Text fontWeight="semibold" color="neutral.900" textAlign="center">
            {set.setNumber}
          </Text>
          {isStrengthExercise ? (
            <>
              <Text color="neutral.700" textAlign="center">
                {set.weight ? `${set.weight} ${set.weightUnit || 'lbs'}` : '-'}
              </Text>
              <Text color="neutral.700" textAlign="center">
                {set.reps || '-'}
              </Text>
              <Text
                color={set.completed ? 'success.500' : 'neutral.500'}
                textAlign="center"
                fontWeight="medium"
              >
                {set.completed ? 'Done' : 'Skipped'}
              </Text>
            </>
          ) : (
            <>
              <Text color="neutral.700" textAlign="center">
                {set.duration ? `${Math.floor(set.duration / 60)}m ${set.duration % 60}s` : '-'}
              </Text>
              <Text color="neutral.700" textAlign="center">
                {set.distance ? `${set.distance} ${set.distanceUnit || 'km'}` : '-'}
              </Text>
            </>
          )}
        </Grid>
      ))}
    </Box>
  );
}

export default WorkoutDetail;
