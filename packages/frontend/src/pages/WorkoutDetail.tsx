import { Box, Heading, Text } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

/**
 * Workout Detail Page
 * Displays completed workout with all exercises and sets
 */
function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <Box p="lg">
      <Heading size="md" mb="lg">
        Workout Detail
      </Heading>
      <Text color="neutral.600">
        Workout ID: {id}
      </Text>
      <Text mt="md" color="neutral.500" fontSize="sm">
        Workout detail view to be implemented
      </Text>
    </Box>
  );
}

export default WorkoutDetail;
