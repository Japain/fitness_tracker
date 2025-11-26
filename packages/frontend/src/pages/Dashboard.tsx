import { Box, Heading, Text, Button } from '@chakra-ui/react';

/**
 * Dashboard/Home Page
 * Displays workout stats, "Start New Workout" button, and incomplete workout resumption
 */
function Dashboard() {
  return (
    <Box p="lg">
      <Heading size="lg" mb="lg">
        Welcome back!
      </Heading>
      <Text mb="xl" color="neutral.600">
        Ready to track your next workout?
      </Text>
      <Button colorScheme="primary" size="lg" w="full">
        Start New Workout
      </Button>
    </Box>
  );
}

export default Dashboard;
