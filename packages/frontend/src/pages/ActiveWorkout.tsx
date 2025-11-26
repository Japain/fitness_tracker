import { Box, Heading, Text } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

/**
 * Active Workout Page
 * Active workout logging screen with exercise selection, set entry, and timer
 */
function ActiveWorkout() {
  const { id } = useParams<{ id: string }>();

  return (
    <Box p="lg">
      <Heading size="md" mb="lg">
        Active Workout
      </Heading>
      <Text color="neutral.600">
        Workout ID: {id}
      </Text>
      <Text mt="md" color="neutral.500" fontSize="sm">
        Exercise selection and set entry UI to be implemented
      </Text>
    </Box>
  );
}

export default ActiveWorkout;
